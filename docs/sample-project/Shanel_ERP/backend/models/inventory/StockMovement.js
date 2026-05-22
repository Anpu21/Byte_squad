const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const StockMovement = sequelize.define('StockMovement', {
    SM_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    P_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    PR_ID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Location: {
        type: DataTypes.ENUM('Shop', 'Production', 'Main_Warehouse'),
        allowNull: false
    },
    Movement_Type: {
        type: DataTypes.ENUM('Production', 'Sale', 'Purchase', 'Transfer_In', 'Transfer_Out', 'Adjustment', 'Return', 'Damage', 'Expired'),
        allowNull: false
    },
    Qty_In: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    Qty_Out: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    Balance_After: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    Ref_Type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    Ref_ID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Move_Date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    Move_Time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    Notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Created_By: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'STOCK_MOVEMENT',
    timestamps: false
});

module.exports = StockMovement;
