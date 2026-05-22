const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class Expense extends Model {}

Expense.init({
    Expense_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Expense_Date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    Expense_Category: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    Expense_Subcategory: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
    },
    Payment_Method: {
        type: Sequelize.ENUM('Cash', 'Bank', 'Cheque', 'Credit_Card'),
        allowNull: false
    },
    Bank_Account_ID: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Paid_To: {
        type: Sequelize.STRING(200),
        allowNull: true
    },
    Description: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Receipt_No: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Receipt_File_Path: {
        type: Sequelize.STRING(500),
        allowNull: true
    },
    Account_ID: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Paid', 'Rejected', 'Cancelled'),
        defaultValue: 'Pending'
    },
    Approved_By: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Approved_Date: {
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
    },
    Updated_At: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize: databaseCon,
    tableName: 'expense',
    timestamps: false
});

module.exports = Expense;
