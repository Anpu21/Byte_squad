const { DataTypes} = require('sequelize');
const sequelize = require('../../config/db');

const SaleItem = sequelize.define('SaleItem',{
    Sale_Item_Id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Sale_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    P_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    U_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Which unit sold'
    },
    PR_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Production batch — NULL for non-produced items'
    },
    Quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'In specified unit',
        get() {
            return parseFloat(this.getDataValue('Quantity'));
        }
    },
    Base_Unit_Qty: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Converted for stock deduction',
        get() {
            return parseFloat(this.getDataValue('Base_Unit_Qty'));
        }
    },
    Unit_Price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per specified unit',
        get() {
            return parseFloat(this.getDataValue('Unit_Price'));
        }
    },
    Price_Level_Used: {
        type: DataTypes.ENUM('Retail', 'Wholesale'),
        allowNull: false
    },
    Line_Discount_Percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        comment: 'Company items only',
        get() {
            return parseFloat(this.getDataValue('Line_Discount_Percentage'));
        }
    },
    Line_Discount_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Line_Discount_Amount'));
        }
    },
    Line_Subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'After discount before tax',
        get() {
            return parseFloat(this.getDataValue('Line_Subtotal'));
        }
    },
    Line_Tax_Rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Line_Tax_Rate'));
        }
    },
    Line_Tax_Amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        get() {
            return parseFloat(this.getDataValue('Line_Tax_Amount'));
        }
    },
    Line_Total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
            return parseFloat(this.getDataValue('Line_Total'));
        }
    },
    Location_Taken_From: {
        type: DataTypes.ENUM('Shop', 'Production'),
        allowNull: true
    },
    Notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Void', 'Returned'),
        defaultValue: 'Active'
    }

    
},{
    tableName: 'Sale_Item',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt:false
})

module.exports = SaleItem;