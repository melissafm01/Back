let sequelize = require('sequelize');
let dotenv = require('dotenv');
dotenv.config();

let Sequelize = new sequelize (
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql'
    }
)

module.exports= Sequelize;