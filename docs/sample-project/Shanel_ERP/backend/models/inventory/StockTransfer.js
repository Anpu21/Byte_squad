const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const StockTransfer = sequelize.define('StockTransfer', {
    ST_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    P_ID: { type: DataTypes.INTEGER, allowNull: true },
    PR_ID: { type: DataTypes.INTEGER, allowNull: true },
    From_Location: { type: DataTypes.ENUM('Production', 'Shop'), allowNull: false },
    To_Location: { type: DataTypes.ENUM('Production', 'Shop'), allowNull: false },
    Qty: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    Transfer_Date: { type: DataTypes.DATE, allowNull: true },
    Transfer_Time: { type: DataTypes.TIME, allowNull: true },
    Reason: { type: DataTypes.TEXT, allowNull: true },
    Status: { type: DataTypes.ENUM('Pending', 'Completed', 'Rejected'), defaultValue: 'Pending' },
    Transferred_By: { type: DataTypes.INTEGER, allowNull: true, comment: 'References User_ID' },
    Received_By: { type: DataTypes.INTEGER, allowNull: true, comment: 'References User_ID' },
    Created_By: { type: DataTypes.INTEGER, allowNull: true, comment: 'References User_ID' }
}, {
    tableName: 'stock_transfer',
    timestamps: true,
    createdAt: 'Created_At',
    updatedAt: 'Updated_At'
});

module.exports = StockTransfer;