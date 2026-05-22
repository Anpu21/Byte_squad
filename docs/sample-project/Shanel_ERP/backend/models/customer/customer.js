const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');   // get sequlize instance

const Customer = sequelize.define('Customer', {
    C_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Customer_Code: {
        type: DataTypes.STRING(50),       
        unique: true
    },
    C_Name: {
        type: DataTypes.STRING(200),      
        allowNull: false
    },
    Contact_Person: {                      
        type: DataTypes.STRING(100),
        allowNull: true
    },
    Phone1: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    Phone2: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    Address: {
        type: DataTypes.TEXT,              
        allowNull: true
    },
    City: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    Customer_Type: {
        type: DataTypes.ENUM('Retail', 'Wholesale'),
        defaultValue: 'Retail'
    },
    Price_Level: {
        type: DataTypes.ENUM('Retail', 'Wholesale'),
        defaultValue: 'Retail'
    },
    Credit_Allowed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    Credit_Limit: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Credit_Limit'));
        }
    },
    Current_Balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Current_Balance'));
        }
    },
    Payment_Terms: {
        type: DataTypes.STRING(100)      
    },
    Preferred_Payment_Method: {
        type: DataTypes.ENUM('Cash', 'Bank_Deposit', 'Cheque', 'Credit'),
        defaultValue: 'Cash'
    },
    Tax_ID: {                              
        type: DataTypes.STRING(50)
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Blocked'),
        defaultValue: 'Active'
    },
    Last_Purchase_Date: {
        type: DataTypes.DATEONLY
    },
    Total_Purchases: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Purchases'));
        }
    },
    Loyalty_Points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    Notes: {
        type: DataTypes.TEXT
    },
    Created_By: {                          
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'customer',                 
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
});

module.exports = Customer;