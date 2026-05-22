const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const Payroll = sequelize.define(
    'Payroll',
    {
        Payroll_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Pay_Period_Month: { type: DataTypes.INTEGER, allowNull: false },
        Pay_Period_Year: { type: DataTypes.INTEGER, allowNull: false },
        Basic_Salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Production_Earnings: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Overtime_Earnings: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Attendance_Bonus: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Tea_Allowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Other_Allowances: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Gross_Salary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        EPF_Employee_Deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        ETF_Employee_Deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Advance_Deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Other_Deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Total_Deductions: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        Net_Salary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        EPF_Employer_Contribution: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        ETF_Employer_Contribution: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Payment_Status: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Paid', 'Cancelled'),
            defaultValue: 'Pending'
        },
        Payment_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Payment_Method: {
            type: DataTypes.ENUM('Cash', 'Bank_Transfer', 'Cheque'),
            defaultValue: 'Bank_Transfer'
        },
        Bank_Reference_No: { type: DataTypes.STRING(100), allowNull: true },
        Pay_Slip_Generated: { type: DataTypes.BOOLEAN, defaultValue: false },
        Pay_Slip_Path: { type: DataTypes.STRING(255), allowNull: true },
        Email_Sent_To_Bank: { type: DataTypes.BOOLEAN, defaultValue: false },
        Email_Sent_Date: { type: DataTypes.DATE, allowNull: true },
        Notes: { type: DataTypes.TEXT, allowNull: true },
        Other_Deductions_Reason: { type: DataTypes.TEXT, allowNull: true },
        Other_Allowances_Reason: { type: DataTypes.TEXT, allowNull: true },
        Generated_By: { type: DataTypes.INTEGER, allowNull: true },
        Approved_By: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'PAYROLL',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Generated_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = Payroll;
