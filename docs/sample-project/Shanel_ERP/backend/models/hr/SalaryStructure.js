const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const SalaryStructure = sequelize.define(
    'SalaryStructure',
    {
        Salary_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Salary_Type: {
            type: DataTypes.ENUM('Monthly_Fixed', 'Production_Based'),
            allowNull: false
        },
        Monthly_Base_Salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Daily_Rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Production_Rate_Per_Card: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Tea_Allowance_Daily: { type: DataTypes.DECIMAL(10, 2), defaultValue: 60.0 },
        OT_Rate_Per_Hour: { type: DataTypes.DECIMAL(10, 2), defaultValue: 400.0 },
        Attendance_Bonus_Amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Effective_From_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Effective_To_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
        Notes: { type: DataTypes.TEXT, allowNull: true },
        Created_By: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'SALARY_STRUCTURE',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = SalaryStructure;
