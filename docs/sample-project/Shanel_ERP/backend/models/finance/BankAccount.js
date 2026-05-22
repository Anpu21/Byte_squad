const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class BankAccount extends Model {}

BankAccount.init({
    Bank_Account_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Account_Chart_ID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    Bank_Name: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    Account_Name: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    Account_Number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    },
    Branch: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Account_Type: {
        type: Sequelize.ENUM('Current', 'Savings', 'Fixed_Deposit'),
        defaultValue: 'Current'
    },
    Opening_Balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    Current_Balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    Currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'LKR'
    },
    Status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Closed'),
        defaultValue: 'Active'
    },
    Created_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    Updated_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize: databaseCon,
    tableName: 'BANK_ACCOUNT',
    timestamps: false
});

module.exports = BankAccount;
