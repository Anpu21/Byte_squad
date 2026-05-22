const sequelize = require('../../config/db');
const { DataTypes } = require('sequelize');
const Customer = require('./customer');
const Product = require('../inventory/Product');



//Model for buying pattern

const CustomerBuyingPattern = sequelize.define('CustomerBuyingPattern', {
    CBP_ID: {
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
        allowNull: false,
        references: {
            model: Product,
            key: 'P_ID'
        }
    },
    Average_Quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
   
    Average_Unit: {
        type: DataTypes.INTEGER,
        comment: 'References U_ID from UNIT_CONVERSION'
    },
    Purchase_Frequency_Days: {
        type: DataTypes.INTEGER,
        comment: 'How often they buy in days'
    },
    Last_Purchase_Date: {           
        type: DataTypes.DATEONLY
    },
    Last_Purchase_Qty: {
        type: DataTypes.DECIMAL(10, 2)
    },
    Next_Expected_Purchase_Date: {
        type: DataTypes.DATEONLY,
        comment: 'Calculated prediction'
    },
    Purchase_Count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total times purchased'
    },
    Total_Quantity_Purchased: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    First_Purchase_Date: {
        type: DataTypes.DATEONLY
    },
    Confidence_Score: {
        type: DataTypes.DECIMAL(5, 2),
        comment: 'Prediction confidence 0-100'
    },
    Notes: {
        type: DataTypes.TEXT
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
    }

},{
    tableName: 'customer_buying_pattern',
    timestamps: false,
    createdAt: false,
    updatedAt: 'Updated_At'
})

module.exports = CustomerBuyingPattern