const { Model, Sequelize } = require("sequelize");
const databaseCon = require("../../config/db");

class AccountChart extends Model {}

AccountChart.init({
    Account_ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Account_Code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
    },
    Account_Name: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    Account_Type: {
        type: Sequelize.ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense'),
        allowNull: false
    },
    Account_Category: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Parent_Account_ID: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Is_Active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    Description: {
        type: Sequelize.TEXT,
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
    tableName: 'ACCOUNT_CHART',
    timestamps: false
});

module.exports = AccountChart;
