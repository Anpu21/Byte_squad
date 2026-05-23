const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const hrOpts = require('./hrModelOptions');

const AttendanceSummary = sequelize.define(
    'AttendanceSummary',
    {
        Summary_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Employee_ID: { type: DataTypes.INTEGER, allowNull: false },
        Month: { type: DataTypes.INTEGER, allowNull: false },
        Year: { type: DataTypes.INTEGER, allowNull: false },
        Total_Working_Days: { type: DataTypes.INTEGER, allowNull: false },
        Present_Days: { type: DataTypes.INTEGER, defaultValue: 0 },
        Absent_Days: { type: DataTypes.INTEGER, defaultValue: 0 },
        Leave_Days: { type: DataTypes.INTEGER, defaultValue: 0 },
        Half_Days: { type: DataTypes.INTEGER, defaultValue: 0 },
        Late_Days: { type: DataTypes.INTEGER, defaultValue: 0 },
        Total_Overtime_Hours: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0.0 },
        Attendance_Bonus_Eligible: { type: DataTypes.BOOLEAN, defaultValue: false },
        Attendance_Bonus_Amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
        Summary_Date: { type: DataTypes.DATEONLY, allowNull: false }
    },
    {
        tableName: 'ATTENDANCE_SUMMARY',
        ...hrOpts,
        timestamps: true,
        createdAt: 'Created_At',
        updatedAt: 'Updated_At'
    }
);

module.exports = AttendanceSummary;
