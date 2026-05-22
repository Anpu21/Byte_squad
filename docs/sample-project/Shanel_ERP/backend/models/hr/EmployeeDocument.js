const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const EmployeeDocument = sequelize.define(
    'EmployeeDocument',
    {
        Document_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Document_Type: {
            type: DataTypes.ENUM(
                'NIC',
                'CV',
                'Educational_Certificate',
                'Employment_Contract',
                'Medical_Certificate',
                'Other'
            ),
            allowNull: false
        },
        Document_Name: { type: DataTypes.STRING(255), allowNull: false },
        File_Path: { type: DataTypes.STRING(500), allowNull: false },
        File_Size: { type: DataTypes.INTEGER, allowNull: true },
        Upload_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Expiry_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Notes: { type: DataTypes.TEXT, allowNull: true },
        Uploaded_By: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'EMPLOYEE_DOCUMENTS',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: false
    }
);

module.exports = EmployeeDocument;
