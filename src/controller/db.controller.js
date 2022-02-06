const dotenv = require('dotenv');
const mysql = require('mysql')
dotenv.config()

const db = mysql.createPool({
    host: process.env.DB_HOST,       //This is your localhost IP
    user: process.env.DB_USER,         // "newuser" created in Step 1(e)
    password: process.env.DB_PASSWORD,  // password for the new user
    database: process.env.DB_DATABASE,      // Database name
    port: process.env.DB_PORT
})

module.export = db