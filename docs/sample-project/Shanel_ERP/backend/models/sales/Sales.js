const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');   


const Sale = sequelize.define('Sale',{
    Sale_Id: {
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Invoice_No: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    C_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Sale_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Sale_Time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    Location: {
        type: DataTypes.ENUM('Shop', 'Production'),
        defaultValue: 'Shop'
    },
    Sale_Type: {
        type: DataTypes.ENUM('Retail', 'Wholesale'),
        allowNull: false
    },
    Price_Level: {
        type: DataTypes.ENUM('Retail', 'Wholesale'),
        allowNull: false
    },
    Subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Subtotal'));
        }
    },
    Discount_Percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Discount_Percentage'));
        }
    },
    Discount_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Discount_Amount'));
        }
    },
    Tax_Rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Tax_Rate'));
        }
    },
    Tax_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Tax_Amount'));
        }
    },
    Total_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Total_Amount'));
        }
    },
    Payment_Status: {
        type: DataTypes.ENUM('Paid', 'Unpaid', 'Partially_Paid'),
        defaultValue: 'Unpaid'
    },
    Paid_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Paid_Amount'));
        }
    },
    Balance_Due: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Balance_Due'));
        }
    },
    Due_Date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    Bill_Printed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    Bill_Print_Count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    First_Print_Date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    Last_Print_Date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    Bill_Format: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    Invoice_Barcode: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    Notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Cashier_ID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Void', 'Cancelled'),
        defaultValue: 'Active'
    }

},{
    tableName: 'Sales',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
})

module.exports = Sale;
