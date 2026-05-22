const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const Employee = sequelize.define(
    'Employee',
    {
        Employee_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_Code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
        Full_Name: { type: DataTypes.STRING(200), allowNull: false },
        Name_With_Initials: { type: DataTypes.STRING(200), allowNull: true },
        NIC: { type: DataTypes.STRING(20), unique: true, allowNull: true },
        Date_Of_Birth: { type: DataTypes.DATEONLY, allowNull: true },
        Gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
        Marital_Status: {
            type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
            allowNull: true
        },
        Contact_Phone: { type: DataTypes.STRING(20), allowNull: false },
        Contact_Phone_2: { type: DataTypes.STRING(20), allowNull: true },
        Email: { type: DataTypes.STRING(100), unique: true, allowNull: true },
        Permanent_Address: { type: DataTypes.TEXT, allowNull: true },
        Current_Address: { type: DataTypes.TEXT, allowNull: true },
        City: { type: DataTypes.STRING(100), allowNull: true },
        Emergency_Contact_Name: { type: DataTypes.STRING(200), allowNull: true },
        Emergency_Contact_Phone: { type: DataTypes.STRING(20), allowNull: true },
        Emergency_Contact_Relationship: { type: DataTypes.STRING(50), allowNull: true },
        Hire_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Confirmation_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Employee_Type: {
            type: DataTypes.ENUM('Permanent', 'Contract', 'Casual', 'Intern'),
            defaultValue: 'Permanent'
        },
        Role: { type: DataTypes.STRING(100), allowNull: false },
        Salary_Category: {
            type: DataTypes.ENUM('Monthly_Fixed', 'Production_Based'),
            allowNull: false
        },
        Working_Hours_Start: { type: DataTypes.TIME, defaultValue: '08:00:00' },
        Working_Hours_End: { type: DataTypes.TIME, defaultValue: '16:00:00' },
        EPF_Eligible: { type: DataTypes.BOOLEAN, defaultValue: false },
        ETF_Eligible: { type: DataTypes.BOOLEAN, defaultValue: false },
        EPF_Number: { type: DataTypes.STRING(50), allowNull: true },
        ETF_Number: { type: DataTypes.STRING(50), allowNull: true },
        Bank_Name: { type: DataTypes.STRING(100), allowNull: true },
        Bank_Account_No: { type: DataTypes.STRING(50), allowNull: true },
        Bank_Branch: { type: DataTypes.STRING(100), allowNull: true },
        Bank_Account_Name: { type: DataTypes.STRING(200), allowNull: true },
        Status: {
            type: DataTypes.STRING(50),
            defaultValue: 'Active'
        },
        Resignation_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Resignation_Reason: { type: DataTypes.TEXT, allowNull: true },
        Termination_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Termination_Reason: { type: DataTypes.TEXT, allowNull: true },
        Notes: { type: DataTypes.TEXT, allowNull: true },
        Photo_Path: { type: DataTypes.STRING(255), allowNull: true },
        Created_By: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'EMPLOYEE',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = Employee;
