const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const Attendance = sequelize.define(
    'Attendance',
    {
        Attendance_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Attendance_Date: { type: DataTypes.DATEONLY, allowNull: false },
        Check_In_Time: { type: DataTypes.TIME, allowNull: true },
        Check_Out_Time: { type: DataTypes.TIME, allowNull: true },
        Total_Hours: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
        Status: {
            type: DataTypes.ENUM('Present', 'Absent', 'Half_Day', 'Leave', 'Holiday', 'Weekend'),
            allowNull: false
        },
        Is_Late: { type: DataTypes.BOOLEAN, defaultValue: false },
        Late_Minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
        Is_Overtime: { type: DataTypes.BOOLEAN, defaultValue: false },
        Overtime_Hours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0.0 },
        Marked_By: {
            type: DataTypes.ENUM('Fingerprint', 'Manual', 'Admin', 'System'),
            defaultValue: 'Manual'
        },
        Notes: { type: DataTypes.TEXT, allowNull: true },
        Cards_Produced: { type: DataTypes.INTEGER, defaultValue: 0 },
        Created_By: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: 'ATTENDANCE',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = Attendance;
