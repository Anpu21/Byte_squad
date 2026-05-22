const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const EmployeeLeave = sequelize.define(
    'EmployeeLeave',
    {
        Leave_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Leave_Type: {
            type: DataTypes.ENUM('Annual', 'Sick', 'Casual', 'No_Pay', 'Maternity', 'Paternity'),
            allowNull: false
        },
        Start_Date: { type: DataTypes.DATEONLY, allowNull: false },
        End_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Total_Days: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
        Reason: { type: DataTypes.TEXT, allowNull: true },
        Status: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
            defaultValue: 'Pending'
        },
        Applied_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Approved_By: { type: DataTypes.INTEGER, allowNull: true },
        Approved_Date: { type: DataTypes.DATEONLY, allowNull: true },
        Rejection_Reason: { type: DataTypes.TEXT, allowNull: true },
        Notes: { type: DataTypes.TEXT, allowNull: true }
    },
    {
        tableName: 'EMPLOYEE_LEAVE',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = EmployeeLeave;
