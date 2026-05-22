const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const SalesSummaryDaily = sequelize.define('SalesSummaryDaily', {
    Summary_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Summary_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Location: {
        type: DataTypes.ENUM('Shop', 'Production'),
        allowNull: true
    },
    Cashier_ID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Total_Sales_Count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    Total_Sales_Amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Sales_Amount'));
        }
    },
    Total_Cash_Sales: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Cash_Sales'));
        }
    },
    Total_Credit_Sales: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Credit_Sales'));
        }
    },
    Total_Card_Sales: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Card_Sales'));
        }
    },
    Total_Discount_Given: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Discount_Given'));
        }
    },
    Total_Tax_Collected: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Tax_Collected'));
        }
    },
    Total_Returns: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Returns'));
        }
    },
    Total_Payments_Received: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Payments_Received'));
        }
    }
}, {
    tableName: 'SALES_SUMMARY_DAILY',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
});

module.exports = SalesSummaryDaily;