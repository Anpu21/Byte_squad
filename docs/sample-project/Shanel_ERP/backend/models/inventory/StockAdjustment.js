const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const StockAdjustment = sequelize.define(
  "StockAdjustment",
  {
    Adjustment_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
        type: DataTypes.ENUM("Shop", "Production"),
        allowNull: false,
    },
    System_Qty: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    Physical_Qty: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    Difference: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    Adjustment_Type: {
        type: DataTypes.ENUM("Stock_Take", "Damage", "Theft", "Expired", "Other"),
        allowNull: false,
    },
    Adjustment_Date: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    Reason: { 
        type: DataTypes.TEXT 
    },
    Status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
        defaultValue: "Approved",
    }, // Auto-approving for now
  },
  {
    tableName: "stock_adjustment",
    timestamps: true,
    createdAt: "Created_At",
    updatedAt: false,
  },
);

module.exports = StockAdjustment;
