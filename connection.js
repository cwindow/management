//jshint esversion: 6
var mysql = require('mysql');
require('dotenv').config()

hostName = process.env.hostName

dbname = process.env.dbname
userName = process.env.userNam
password= process.env.password

var db = mysql.createPool({
  connectionLimit : 1000,
    connectTimeout  : 60 * 60 * 1000,
    acquireTimeout  : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,
    host: hostName,
    user: userName,
    password: password,
    database: dbname
});

db.getConnection((err,connection)=> {
  if(err)
  throw err;
  console.log('Database connected successfully');
  connection.release();
});

module.exports = db;