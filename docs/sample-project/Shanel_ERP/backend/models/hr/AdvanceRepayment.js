const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const AdvanceRepayment = sequelize.define(
    'AdvanceRepayment',
    {
        Repayment_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Advance_ID: { type: DataTypes.INTEGER, allowNull: false },
        Payroll_ID: { type: DataTypes.INTEGER, allowNull: false },
        Deduction_Amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        Deduction_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Balance_After: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
    },
    {
        tableName: 'ADVANCE_REPAYMENT',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: false
    }
);

module.exports = AdvanceRepayment;
