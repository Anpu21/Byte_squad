const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ProductReturn = sequelize.define('ProductReturn', {
    RT_ID: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, // Ensured correct camelCase
        autoIncrement: true 
    },
    P_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    PR_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        comment: 'Batch ID if applicable' 
    },
    Return_Type: { 
        type: DataTypes.ENUM('Customer', 'Supplier'), 
        allowNull: false 
    },
    Ref_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        comment: 'Sale_ID for customer, PO_ID for supplier' 
    },
    Qty: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false,
        comment: 'Quantity in BASE UNIT' 
    },
    Reason: { 
        type: DataTypes.ENUM('Damaged', 'Expired', 'Wrong_Product', 'Quality_Issue', 'Overstocked', 'Other'), 
        allowNull: false 
    },
    Reason_Details: { 
        type: DataTypes.TEXT 
    },
    Return_Date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    Refund_Amount: { 
        type: DataTypes.DECIMAL(10, 2) 
    },
    Restock: { 
        type: DataTypes.TINYINT(1), // Changed to TINYINT to match your MySQL 'tinyint(1)'
        defaultValue: 1,
        comment: '1 = Add back to inventory, 0 = Waste/Throw' 
    },
    Status: { 
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Completed'), 
        defaultValue: 'Pending' 
    },
    Approved_By: { 
        type: DataTypes.INTEGER 
    },
    Approved_Date: { 
        type: DataTypes.DATEONLY 
    },
    Notes: { 
        type: DataTypes.TEXT 
    },
    Created_By: { 
        type: DataTypes.INTEGER 
    }
}, {
    tableName: 'product_return',
    timestamps: true,
    createdAt: 'Created_At', 
    updatedAt: 'Updated_At'  
});

module.exports = ProductReturn;