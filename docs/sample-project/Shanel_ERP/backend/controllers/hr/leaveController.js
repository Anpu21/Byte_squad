const { EmployeeLeave, Employee } = require('../../models/index');
const { Op } = require('sequelize');
const { findEmployeeByParam } = require('../../utils/hrEmployeeLookup');

/**
 * Retrieves leave requests from the database.
 * Supports filtering by employeeId, status (Pending/Approved/Rejected), and date range.
 */
const getLeaves = async (req, res) => {
    try {
        const { employeeId, status, from, to } = req.query;
        const where = {};

        if (employeeId) {
            const emp = await findEmployeeByParam(employeeId);
            if (!emp) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            where.Employee_ID = emp.Employee_ID;
        }
        if (status) where.Status = status;
        if (from && to) {
            where.Start_Date = { [Op.lte]: to };
            where.End_Date = { [Op.gte]: from };
        }

        const rows = await EmployeeLeave.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    attributes: ['Employee_ID', 'Employee_Code', 'Full_Name']
                }
            ],
            order: [['Applied_Date', 'DESC']]
        });

        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('getLeaves error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch leave records',
            error: error.message
        });
    }
};

/**
 * Creates a new leave request.
 * Sets the initial status to 'Pending'.
 * Requires employee identification, leave type, and dates.
 */
const createLeave = async (req, res) => {
    try {
        const {
            Employee_ID,
            employeeCode,
            Leave_Type,
            Start_Date,
            End_Date,
            Total_Days,
            Reason,
            Applied_Date,
            Notes
        } = req.body;

        let empId = Employee_ID;
        if (!empId && employeeCode) {
            const emp = await findEmployeeByParam(employeeCode);
            if (!emp) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            empId = emp.Employee_ID;
        }

        if (!empId || !Leave_Type || !Start_Date || !End_Date || Total_Days == null || !Applied_Date) {
            return res.status(400).json({
                success: false,
                message: 'Employee_ID (or employeeCode), Leave_Type, Start_Date, End_Date, Total_Days, Applied_Date are required'
            });
        }

        const created = await EmployeeLeave.create({
            Employee_ID: empId,
            Leave_Type,
            Start_Date,
            End_Date,
            Total_Days,
            Reason,
            Applied_Date,
            Notes,
            Status: 'Pending'
        });

        return res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error('createLeave error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create leave request',
            error: error.message
        });
    }
};

/**
 * Finalizes a leave request by marking it as 'Approved'.
 * Records who approved it and on what date.
 */
const approveLeave = async (req, res) => {
    try {
        const row = await EmployeeLeave.findByPk(req.params.leaveId);
        if (!row) {
            return res.status(404).json({ success: false, message: 'Leave record not found' });
        }

        const { Approved_By, Approved_Date } = req.body;
        await row.update({
            Status: 'Approved',
            Approved_By: Approved_By || null,
            Approved_Date: Approved_Date || new Date().toISOString().slice(0, 10),
            Rejection_Reason: null
        });

        return res.status(200).json({ success: true, data: row });
    } catch (error) {
        console.error('approveLeave error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve leave',
            error: error.message
        });
    }
};

/**
 * Finalizes a leave request by marking it as 'Rejected'.

 */
const rejectLeave = async (req, res) => {
    try {
        const row = await EmployeeLeave.findByPk(req.params.leaveId);
        if (!row) {
            return res.status(404).json({ success: false, message: 'Leave record not found' });
        }

        const { Approved_By, Rejection_Reason } = req.body;
        if (!Rejection_Reason) {
            return res.status(400).json({ success: false, message: 'Rejection_Reason is required' });
        }

        await row.update({
            Status: 'Rejected',
            Approved_By: Approved_By || null,
            Approved_Date: new Date().toISOString().slice(0, 10),
            Rejection_Reason
        });

        return res.status(200).json({ success: true, data: row });
    } catch (error) {
        console.error('rejectLeave error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject leave',
            error: error.message
        });
    }
};

module.exports = {
    getLeaves,
    createLeave,
    approveLeave,
    rejectLeave
};
