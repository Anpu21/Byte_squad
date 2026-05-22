const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const User = sequelize.define('User', {
    User_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'JWT subject claim (sub)'
    },
    Username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Login identity, indexed'
    },
    Password_Hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'bcrypt / argon2 hash — never plain text'
    },
    Full_Name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Display name'
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Optional contact'
    },
    Phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Phone number'
    },
    User_Type: {
        type: DataTypes.ENUM('Admin', 'Manager', 'Sales_Officer', 'Cashier', 'Production_Staff', 'Finance_Staff'),
        allowNull: false
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
        defaultValue: 'Active'
    },
    Last_Login: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Audit trail'
    },
    Failed_Login_Attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Brute-force counter'
    },
    Account_Locked_Until: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Lock expiry after 5 failed attempts'
    }
}, {
    tableName: 'USER',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
});

module.exports = User;
