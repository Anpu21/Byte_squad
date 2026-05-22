const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Inventory = sequelize.define('Inventory', {
    INV_ID: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true },
    P_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: false },
    PR_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: true },
    Location: { 
        type: DataTypes.ENUM('Shop', 'Production'), 
        allowNull: false 
    },
    Qty: { 
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 0.00 }
}, {
    tableName: 'inventory',
    timestamps: true,
    createdAt: false, // In your DB, this is Last_Updated
    updatedAt: 'Last_Updated'
});

module.exports = Inventory;