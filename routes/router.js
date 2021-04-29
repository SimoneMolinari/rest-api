const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const validator = require('../lib/valdiate.js');
const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');



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

router.post('/login', (req, res, next) =>  {
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
                'icanenteryoucannot', {
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


router.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
  res.send('This is the secret content. Only logged in users can see that!');
});


router.post('/getProdotti', (req, res, next) => {
    db.query(
        `SELECT id_prod as id, nome_prod as nome FROM maillist_table WHERE id_user=${db.escape(req.body.id)};`, (err, result) => {
            if (err) {
                return res.send(err);
            } else {
                return res.status(200).send(result); 
            }
        });
});

router.post('/updateProdotti', (req, res, next) => {
  //query sbagliata
    db.query(
        `UPDATE maillist_table SET id_prod = ${db.escape(req.body.new_id_prod)}, nome_prod = ${db.escape(req.body.nome_prod)}
        WHERE LOWER(id_prod) = LOWER(${db.escape(req.body.old_id_prod)}) AND ${db.escape(req.body.id)};`, (err, result) => {
            if (err) {
                return res.send(err);
            } else {
                return res.status(200).send(result); 
            }
        });
});


router.post('/addProdotti', (req, res, next) => {  
  
  let exist;
  db.query(
    `SELECT * FROM prod_table WHERE LOWER(id_prod) = LOWER(${db.escape(req.body.id_prod)});`, (err, result) => {
      if (err) {
        return res.send(err);
      } 

      if(result.length) {
        exist = true;
        db.query(
          `INSERT INTO maillist_table (id_prod, id_user, email, first, nome_prod)
          VALUES (${db.escape(req.body.id_prod)}, ${db.escape(req.body.id_user)}, ${db.escape(req.body.email)}, 0, ${db.escape(req.body.nome_prod)});`, (err, result) => {
              if (err) {
                  return res.send(err);
              } else {
                  return res.send({msg: "New entry in maillist" }); 
              }
          });
      } else {
        exist = false;
        db.query(
          `INSERT INTO prod_table VALUES (${db.escape(req.body.id_prod)}, '', 0);`, (err, result) => {
              if (err) {
                  return res.send(err);
              }
          });
          db.query(
              `INSERT INTO maillist_table (id_prod, id_user, email, first, nome_prod)
              VALUES (${db.escape(req.body.id_prod)}, ${db.escape(req.body.id_user)}, ${db.escape(req.body.email)}, 0, ${db.escape(req.body.nome_prod)});`, (err, result) => {
                  if (err) {
                      return res.send(err);
                  } else {
                      return res.send({msg: "New entry in maillist  and a new product added" }); 
                  }
              });
      }
    });
});


router.post('/validateAsin', async (req, res, next) => {
  let result = await validator.validate(req.body.id_prod);
  await res.send({valid: result});
});

module.exports = router;