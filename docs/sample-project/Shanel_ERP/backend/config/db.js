const { Sequelize } = require('sequelize');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const dbName = process.env.DB_NAME || 'shanel_erp';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS ?? '1234';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);

const logging =
    process.env.DB_LOGGING === '1' || process.env.DB_LOGGING === 'true'
        ? console.log
        : false;

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging,
    dialectOptions: {
        charset: 'utf8mb4',
        supportBigNumbers: true,
        bigNumberStrings: true
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    },
    pool: {
        max: Number(process.env.DB_POOL_MAX || 10),
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
