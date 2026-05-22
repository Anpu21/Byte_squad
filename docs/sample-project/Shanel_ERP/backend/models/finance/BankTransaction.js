const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class BankTransaction extends Model {}

BankTransaction.init({
    Transaction_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Bank_Account_ID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    Transaction_Date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    Transaction_Type: {
        type: Sequelize.ENUM('Deposit', 'Withdrawal', 'Transfer_In', 'Transfer_Out'),
        allowNull: false
    },
    Reference_Type: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    Reference_ID: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Debit_Amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    Credit_Amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    Balance_After: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
    },
    Description: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Cheque_No: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    Cleared: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    Cleared_Date: {
        type: Sequelize.DATEONLY,
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
}, {
    sequelize: databaseCon,
    tableName: 'BANK_TRANSACTION',
    timestamps: false
});

module.exports = BankTransaction;
