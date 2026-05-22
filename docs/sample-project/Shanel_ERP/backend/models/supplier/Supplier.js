const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../user/User');

const Supplier = sequelize.define('Supplier', {
    S_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    S_Code: {
        type: DataTypes.STRING(50),
        unique: true
    },
    S_Name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    Contact_Person: {
        type: DataTypes.STRING(100)
    },
    Phone_No: {
        type: DataTypes.STRING(20)
    },
    Phone_No_2: {
        type: DataTypes.STRING(20)
    },
    Email: {
        type: DataTypes.STRING(100)
    },
    Address: {
        type: DataTypes.TEXT
    },
    City: {
        type: DataTypes.STRING(100)
    },
    Country: {
        type: DataTypes.STRING(100),
        defaultValue: 'Sri Lanka'
    },
    Payment_Terms: {
        type: DataTypes.STRING(100)
    },
    Credit_Limit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Credit_Limit'));
        }
    },
    Current_Balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Current_Balance'));
        }
    },
    Tax_ID: {
        type: DataTypes.STRING(50)
    },
    Bank_Name: {
        type: DataTypes.STRING(100)
    },
    Bank_Account_No: {
        type: DataTypes.STRING(50)
    },
    Bank_Branch: {
        type: DataTypes.STRING(100)
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Blocked'),
        defaultValue: 'Active'
    },
    Rating: {
        type: DataTypes.INTEGER
    },
    Notes: {
        type: DataTypes.TEXT
    },
    Created_By: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'User_ID'
        }
    }
}, {
    tableName: 'supplier',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
});

module.exports = Supplier;
