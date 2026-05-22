const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const AdvanceSalary = sequelize.define(
    'AdvanceSalary',
    {
        Advance_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Advance_Amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        Advance_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Reason: { type: DataTypes.TEXT, allowNull: true },
        Repayment_Months: { type: DataTypes.INTEGER, allowNull: false },
        Monthly_Deduction_Amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        Total_Repaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        Status: {
            type: DataTypes.ENUM('Active', 'Fully_Paid', 'Cancelled'),
            defaultValue: 'Active'
        },
        Approved_By: { type: DataTypes.INTEGER, allowNull: true },
        Approved_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Notes: { type: DataTypes.TEXT, allowNull: true },
        Created_By: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'ADVANCE_SALARY',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = AdvanceSalary;
