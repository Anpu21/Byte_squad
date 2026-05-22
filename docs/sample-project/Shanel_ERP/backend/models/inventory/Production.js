const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Production = sequelize.define('Production', {
    PR_ID: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true },
        
    P_ID: { 
        type: DataTypes.INTEGER, 
        allowNull: false },

    Batch_No: { 
        type: DataTypes.STRING(50), 
        unique: true, 
        allowNull: false },

    Production_Date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false },

    Exp_Date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false },

    Total_Qty_Produced: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false },

    Status: { 
        type: DataTypes.ENUM('In_Progress', 'Completed', 'Quality_Check', 'Approved', 'Rejected'), 
        defaultValue: 'In_Progress' 
    }
}, {
    tableName: 'production',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
});

module.exports = Production;