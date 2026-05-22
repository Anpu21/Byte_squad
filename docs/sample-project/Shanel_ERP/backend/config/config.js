const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const baseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS === undefined ? '1234' : process.env.DB_PASS,
  database: process.env.DB_NAME || 'shanel_erp',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4'
  }
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST
  },
  production: {
    ...baseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST
  }
};
