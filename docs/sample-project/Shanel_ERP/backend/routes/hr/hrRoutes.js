/**
 * HR MODULE ROUTES:
 * Defines the API surface for the entire HR system, including:
 * - Employee lifecycle and document management
 * - Leave request submission and approval workflows
 * - Daily and bulk attendance logging
 * - Payroll calculations (Drafts, Mail to Bank) and status management
 * - Advance salary and repayment tracking
 */
const express = require('express');
const router = express.Router();
const { uploadHrDocument } = require('../../middleware/hrUploadMiddleware');
const { getHrDbHealth } = require('../../controllers/hr/healthController');

const {
    getEmployees,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee
} = require('../../controllers/hr/employeeController');

const {
    getLeaves,
    createLeave,
    approveLeave,
    rejectLeave
} = require('../../controllers/hr/leaveController');

const {
    getAttendance,
    bulkAttendance
} = require('../../controllers/hr/attendanceController');

const {
    getPayrolls,
    createPayroll,
    updatePayroll,
    mailPayrollToBank
} = require('../../controllers/hr/payrollController');

router.get('/health', getHrDbHealth);

// --- Employees ---
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:employeeId', updateEmployee);
router.patch('/employees/:employeeId/status', updateEmployeeStatus);
router.delete('/employees/:employeeId', deleteEmployee);

// --- Leave ---
router.get('/leaves', getLeaves);
router.post('/leaves', createLeave);
router.patch('/leaves/:leaveId/approve', approveLeave);
router.patch('/leaves/:leaveId/reject', rejectLeave);

// --- Attendance ---
router.get('/attendance', getAttendance);
router.post('/attendance/bulk', bulkAttendance);


// --- Payroll ---
router.post('/payroll/mail-to-bank', mailPayrollToBank);
router.get('/payroll', getPayrolls);
router.post('/payroll', createPayroll);
router.put('/payroll/:payrollId', updatePayroll);

module.exports = router;
