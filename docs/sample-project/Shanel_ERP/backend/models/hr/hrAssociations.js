/**
 * HR MODULE ASSOCIATIONS:
 * Defines the relational mappings between HR models using Sequelize.
 * Centralizes connections for:
 * - Employee <-> User (System Access)
 * - Employee <-> Attendance/Leaves (Operational Logs)
 * - Employee <-> Payroll/SalaryStructure/Advances (Financial Logs)
 */
const User = require('../user/User');
const Employee = require('./Employee');
const EmployeeLeave = require('./EmployeeLeave');
const EmployeeDocument = require('./EmployeeDocument');
const Attendance = require('./Attendance');
const AttendanceSummary = require('./AttendanceSummary');
const SalaryStructure = require('./SalaryStructure');
const Payroll = require('./Payroll');
const AdvanceSalary = require('./AdvanceSalary');
const AdvanceRepayment = require('./AdvanceRepayment');

module.exports = () => {
    // USER <-> EMPLOYEE (User.Employee_ID)
    // User.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'EmployeeProfile' });
    // Employee.hasOne(User, { foreignKey: 'Employee_ID', as: 'LinkedUser' });

    Employee.belongsTo(User, { foreignKey: 'Created_By', as: 'Creator' });
    User.hasMany(Employee, { foreignKey: 'Created_By', as: 'CreatedEmployees' });

    Employee.hasMany(EmployeeLeave, { foreignKey: 'Employee_ID', as: 'Leaves' });
    EmployeeLeave.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });

    EmployeeLeave.belongsTo(User, { foreignKey: 'Approved_By', as: 'Approver' });
    User.hasMany(EmployeeLeave, { foreignKey: 'Approved_By', as: 'ApprovedLeaves' });

    Employee.hasMany(EmployeeDocument, { foreignKey: 'Employee_ID', as: 'Documents' });
    EmployeeDocument.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });
    EmployeeDocument.belongsTo(User, { foreignKey: 'Uploaded_By', as: 'Uploader' });

    Employee.hasMany(Attendance, { foreignKey: 'Employee_ID', as: 'AttendanceRecords' });
    Attendance.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });
    Attendance.belongsTo(User, { foreignKey: 'Created_By', as: 'MarkedByUser' });

    Employee.hasMany(AttendanceSummary, { foreignKey: 'Employee_ID', as: 'AttendanceSummaries' });
    AttendanceSummary.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });

    Employee.hasMany(SalaryStructure, { foreignKey: 'Employee_ID', as: 'SalaryStructures' });
    SalaryStructure.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });
    SalaryStructure.belongsTo(User, { foreignKey: 'Created_By', as: 'Creator' });

    Employee.hasMany(Payroll, { foreignKey: 'Employee_ID', as: 'Payrolls' });
    Payroll.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });
    Payroll.belongsTo(User, { foreignKey: 'Generated_By', as: 'Generator' });
    Payroll.belongsTo(User, { foreignKey: 'Approved_By', as: 'PayrollApprover' });

    Employee.hasMany(AdvanceSalary, { foreignKey: 'Employee_ID', as: 'Advances' });
    AdvanceSalary.belongsTo(Employee, { foreignKey: 'Employee_ID', as: 'Employee' });
    AdvanceSalary.belongsTo(User, { foreignKey: 'Approved_By', as: 'AdvanceApprover' });
    AdvanceSalary.belongsTo(User, { foreignKey: 'Created_By', as: 'AdvanceCreator' });

    AdvanceSalary.hasMany(AdvanceRepayment, { foreignKey: 'Advance_ID', as: 'Repayments' });
    AdvanceRepayment.belongsTo(AdvanceSalary, { foreignKey: 'Advance_ID', as: 'Advance' });
    AdvanceRepayment.belongsTo(Payroll, { foreignKey: 'Payroll_ID', as: 'Payroll' });
    Payroll.hasMany(AdvanceRepayment, { foreignKey: 'Payroll_ID', as: 'AdvanceRepayments' });
};
