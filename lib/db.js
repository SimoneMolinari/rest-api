const mysql = require('mysql');

const connection = mysql.createConnection({
    host:'192.168.1.100',
    user:'root',
    database:'progetto_esame',
    password:'fagiolini!primavera'
});

connection.connect();
module.exports = connection;
