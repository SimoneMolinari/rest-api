express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const validator = require('../lib/valdiate.js');
const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');
const fetch = require('node-fetch');
var shell = require('shelljs');

router.post('/register', userMiddleware.validateRegister, (req, res, next) => {
  db.query(`SELECT * FROM users WHERE LOWER(username) = LOWER(${db.escape(req.body.username)});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: 'This username is already in use!'
        });
      } else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err
            });
          } else {
            // has hashed pw => add to database
            db.query(`INSERT INTO users (id, username, password, registered, email) VALUES 
                    ('${uuid.v4()}', ${db.escape(req.body.username)}, ${db.escape(hash)}, now(), ${db.escape(req.body.email)})`,
              (err, result) => {
                if (err) {
                  throw err;
                  return res.status(400).send({
                    msg: err
                  });
                }
                return res.status(201).send({
                  msg: 'Registered!'
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post('/login', (req, res, next) => {
  db.query(
    `SELECT * FROM users WHERE username = ${db.escape(req.body.username)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        throw err;
        return res.status(400).send({
          msg: err
        });
      }
      if (!result.length) {
        return res.status(401).send({
          msg: 'Username or password is incorrect!'
        });
      }
      // check password
      bcrypt.compare(
        req.body.password,
        result[0]['password'],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            throw bErr;
            return res.status(401).send({
              msg: 'Username or password is incorrect!'
            });
          }
          if (bResult) {
            const token = jwt.sign({
              username: result[0].username,
              userId: result[0].id
            },
              'eE5!dsz8bFb^bL@rRQFiy*cWJxXNEu!awZ!er6gRn8Vb@FTYE@', {
              expiresIn: '7d'
            }
            );
            db.query(
              `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
            );
            return res.status(200).send({
              msg: 'Logged in!',
              token,
              id: result[0].id,
              email: result[0].email
            });
          }
          return res.status(401).send({
            msg: 'Username or password is incorrect!'
          });
        }
      );
    }
  );
});


router.post('/getProdotti', userMiddleware.isLoggedIn, (req, res, next) => {
  db.query(
    `SELECT id_prod, nome_prod, id_maillist, price FROM maillist_table WHERE id_user=${db.escape(req.body.id_user)};`, (err, result) => {
      if (err) {
        return res.send(err);
      } else {
        return res.status(200).send(result);
      }
    });
});


router.post('/addProdotti', userMiddleware.isLoggedIn, (req, res, next) => {

  let exist;
  db.query(
    `SELECT * FROM prod_table WHERE LOWER(id_prod) = LOWER(${db.escape(req.body.id_prod)});`, (err, result) => {
      if (err) {
        return res.send(err);
      }

      if (result.length) {
        exist = true;
        db.query(
          `INSERT INTO maillist_table (id_prod, id_user, email, first, nome_prod, price)
          VALUES (${db.escape(req.body.id_prod)}, ${db.escape(req.body.id_user)}, ${db.escape(req.body.email)}, 0, ${db.escape(req.body.nome_prod)}, ${db.escape(req.body.price)});`, (err, result) => {
          if (err) {
            return res.send(err);
          } else {
            return res.send({ msg: "New entry in maillist" });
          }
        });
      } else {
        exist = false;
        db.query(
          `INSERT INTO prod_table VALUES (${db.escape(req.body.id_prod)}, '');`, (err, result) => {
            if (err) {
              return res.send(err);
            }
          });
        db.query(
          `INSERT INTO maillist_table (id_prod, id_user, email, first, nome_prod, price)
              VALUES (${db.escape(req.body.id_prod)}, ${db.escape(req.body.id_user)}, ${db.escape(req.body.email)}, 0, ${db.escape(req.body.nome_prod)}, ${db.escape(req.body.price)});`, (err, result) => {
          if (err) {
            return res.send(err);
          } else {
            return res.send({ msg: "New entry in maillist  and a new product added" });
          }
        });
      }
    });
});

/*
router.post('/validateAsin', userMiddleware.isLoggedIn, async (req, res, next) => {
  let result = await validator.validate(req.body.id_prod).catch(err =>{console.log(err)});
  await res.send({ valid: result });
});
*/

router.post('/deleteAll', userMiddleware.isLoggedIn, (req, res, next) => {
  if (req.body.id_user != undefined) {
    db.query(
      `DELETE FROM maillist_table 
       WHERE id_user =  ${db.escape(req.body.id_user)};`, (err, result) => {
      if (err) {
        return res.send(err);
      } else {
        return res.send({ msg: "Deleted all products from maillist" });
      }
    });
  } else {
    return res.send({ msg: "No id_user" });
  }
});



router.post('/getProdotto', userMiddleware.isLoggedIn, (req, res, next) => {

  db.query(
    `SELECT * FROM maillist_table 
       WHERE id_user =  ${db.escape(req.body.id_user)} AND id_maillist = ${db.escape(req.body.id_maillist)};`, (err, result) => {
    if (err) {
      return res.send(err);
    }
    if (result != null && result != undefined) {
      res.send(result);
    } else {
      return res.send({ msg: "Cannot access this product" });
    }

  });
});


router.post('/updateProdotto', userMiddleware.isLoggedIn, (req, res, next) => {

  db.query(
    `UPDATE maillist_table SET id_prod = ${db.escape(req.body.id_prod)}, nome_prod = ${db.escape(req.body.nome_prod)}, price = ${db.escape(req.body.price)}
        WHERE id_maillist = ${db.escape(req.body.id_maillist)} AND id_user =  ${db.escape(req.body.id_user)};`, (err, result) => {
    if (err) {
      return res.send(err);
    } else {
      return res.send({ msg: "Updated product in maillist" });
    }
  });
});

router.post('/deleteOne', userMiddleware.isLoggedIn, (req, res, next) => {

  db.query(
    `DELETE FROM maillist_table 
     WHERE id_maillist = ${db.escape(req.body.id_maillist)} AND id_user =  ${db.escape(req.body.id_user)};`, (err, result) => {
    if (err) {
      return res.send(err);
    } else {
      return res.send({ msg: "Deleted product in maillist" });
    }
  });
});

router.post('/updateUser', userMiddleware.isLoggedIn, (req, res, next) => {

    db.query(
      `SELECT password FROM users WHERE id = ${db.escape(req.body.id_user)};`,
      (err, result) => {
        // 
        if (err) {
          throw err;
          return res.status(400).send({
            msg: err
          });
        }
        // check password
        bcrypt.compare(
          req.body.password,
          result[0]['password'],
          (bErr, bResult) => {
            // wrong password
            if (bErr) {
              return res.status(401).send({
                msg: 'Password is incorrect!'
              });
            }
            if (bResult) {

              bcrypt.hash(req.body.new_password, 10, (err, hash) => {
                if (err) {
                  return res.status(500).send({
                    msg: err
                  });
                } else {
                  // has hashed pw => add to database
                  db.query(
                    `UPDATE users 
                      SET email = ${db.escape(req.body.email)}, password = ${db.escape(hash)}
                      WHERE id = ${db.escape(req.body.id_user)};`, (err2, result) => {
                    if (err2) {
                      return res.send(err2);
                    } else {
                      //res.send({ msg: "User updated " });
                    }
                  });

                  db.query(
                    `UPDATE maillist_table
                      SET email = ${db.escape(req.body.email)}
                      WHERE id_user = ${db.escape(req.body.id_user)};`, (err2, result) => {
                    if (err2) {
                      return res.send(err2);
                    } else {
                      return res.send({ msg: "cred and list updated " });
                    }
                  });

		}
              });
            }
          });
      });
});

router.post('/validateAsin', userMiddleware.isLoggedIn, async (req, res, next) => {

	var regex = /^[A-Za-z0-9 ]+$/
 	let asin = req.body.id_prod;
        //Validate TextBox value against the Regex.
        var isValid = regex.test(asin);
	let code;
if(isValid) {
	
  let url = 'https://amazon.it/dp/' + asin;
  

  code = shell.exec("wget --server-response "+url+" 2>&1 | awk '/^  HTTP/{print $2}'").stdout;
  code = code.replace(/301/g, '');
  code = code.replace(/\n/g, '');  

  console.log(code);
  } else {
	console.log('Special Chars Detetcted');
	code = 404;
  }

  res.send({valid: code});

});



module.exports = router;
