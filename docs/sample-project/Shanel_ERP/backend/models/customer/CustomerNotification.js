const sequlize = require('../../config/db');
const {DataTypes} =require('sequelize');
const Customer = require('./customer');
const Product = require('../inventory/Product');
const User = require('../user/User');

//Model for Notifications
const CustomerNofification = sequlize.define('CustomerNotification',{
    Notification_ID: {
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
    P_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,               
        references: {
            model: Product,
            key: 'P_ID'
        }
    },
    Notification_Type: {
        type: DataTypes.ENUM(
            'Next_Purchase_Due',
            'Credit_Limit_Exceeded',
            'Overdue_Payment',
            'Special_Offer',
            'Birthday',
            'Anniversary'
        ),
        allowNull: false
    },
    Notification_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Notification_Message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Is_Sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    Sent_Date: {
        type: DataTypes.DATE,         
    },
    Sent_By: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'User_ID'
        }
    },
    Send_Via: {
        type: DataTypes.ENUM(
            'SMS',
            'Email',
            'WhatsApp',
            'Dashboard',
            'Call'
        ),
        defaultValue: 'Dashboard'
    },
    Phone_Number: {
        type: DataTypes.STRING(20)
    },
    Email_Address: {
        type: DataTypes.STRING(100)
    },
    Status: {
        type: DataTypes.ENUM(
            'Pending',
            'Sent',
            'Failed',
            'Cancelled'
        ),
        defaultValue: 'Pending'
    }

},{
    tableName: 'customer_notifications',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: false
    
})

module.exports = CustomerNofification;