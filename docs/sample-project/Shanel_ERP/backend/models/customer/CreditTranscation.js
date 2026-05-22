// 

const sequlize = require('../../config/db');
const { DataTypes } = require('sequelize');
const Customer = require('./customer');
const User = require('../user/User');
  

//Model for Credit Transaction

const CreditTranscation = sequlize.define('CreditTranscation',{
    Credit_Trans_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Customer_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Customer,
            key: 'C_ID'
        }
    },
    Sale_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,                //  nullable, only set when credit taken
        comment: 'For credit taken'
    },
    Pay_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,                //  nullable, only set when credit paid
        comment: 'For credit paid'
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
        comment: 'Balance after this transaction',
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
},{
    tableName: 'credit_transactions',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: false
})

module.exports = CreditTranscation;