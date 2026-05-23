const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Supplier = require('./Supplier');
const User = require('../user/User');

const SupplierTransaction = sequelize.define('SupplierTransaction', {
    Supplier_Trans_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Supplier_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Supplier,
            key: 'S_ID'
        }
    },
    PO_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For credit taken (Purchase Order)'
    },
    Payment_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'For credit paid (Supplier Payment)'
    },
    Transaction_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Transaction_Type: {
        type: DataTypes.ENUM(
            'Credit_Taken',
            'Credit_Paid',
            'Credit_Adjusted',
            'Credit_WriteOff'
        ),
        allowNull: false
    },
    Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            return parseFloat(this.getDataValue('Amount'));
        }
    },
    Running_Balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Balance owed to supplier after this transaction',
        get() {
            return parseFloat(this.getDataValue('Running_Balance'));
        }
    },
    Reference_No: {
        type: DataTypes.STRING(100)
    },
    Notes: {
        type: DataTypes.TEXT
    },
    Created_By: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'User_ID'
        }
    }
}, {
    tableName: 'supplier_transactions',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: false
});

module.exports = SupplierTransaction;
