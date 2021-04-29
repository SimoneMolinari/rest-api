const mysql = require('mysql');

const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    database:'progetto_esame',
    password:''
});

connection.connect();
module.exports = connection;