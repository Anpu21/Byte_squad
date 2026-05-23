const { Model, Sequelize } = require('sequelize');
const databaseCon = require('../../config/db');

class Income extends Model {}

Income.init(
    {
        Income_ID: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Income_Date: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        Income_Category: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        Amount: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false
        },
        Source: {
            type: Sequelize.STRING(200),
            allowNull: false
        },
        Description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        Receipt_No: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        Account_ID: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        Created_By: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        Created_At: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    },
    {
        sequelize: databaseCon,
        tableName: 'INCOME',
        timestamps: false
    }
);

module.exports = Income;
