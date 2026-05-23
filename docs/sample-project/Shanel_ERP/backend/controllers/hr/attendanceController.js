const { Attendance, Employee } = require('../../models/index');
const { Op } = require('sequelize');
const { findEmployeeByParam } = require('../../utils/hrEmployeeLookup');

/**
 * Retrieves daily attendance records.
 */
const getAttendance = async (req, res) => {
    try {
        const { employeeId, from, to, status } = req.query;
        const where = {};

        if (employeeId) {
            const emp = await findEmployeeByParam(employeeId);
            if (!emp) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            where.Employee_ID = emp.Employee_ID;
        }
        if (from && to) {
            where.Attendance_Date = { [Op.between]: [from, to] };
        } else if (from) {
            where.Attendance_Date = { [Op.gte]: from };
        } else if (to) {
            where.Attendance_Date = { [Op.lte]: to };
        }
        if (status) where.Status = status;

        const rows = await Attendance.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    attributes: ['Employee_ID', 'Employee_Code', 'Full_Name']
                }
            ],
            order: [['Attendance_Date', 'DESC']]
        });

        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('getAttendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance',
            error: error.message
        });
    }
};

/**
 * Saves multiple attendance records at once.
 * Useful for marking the entire staff's attendance for a day in one operation.
 */
const bulkAttendance = async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'records array is required'
            });
        }

        const results = [];
        for (const rec of records) {
            let empId = rec.Employee_ID;
            if (!empId && rec.employeeCode) {
                const emp = await findEmployeeByParam(rec.employeeCode);
                if (!emp) {
                    results.push({ ok: false, error: 'Employee not found', rec });
                    continue;
                }
                empId = emp.Employee_ID;
            }
            if (!empId || !rec.Attendance_Date || !rec.Status) {
                results.push({ ok: false, error: 'Missing Employee_ID/Attendance_Date/Status', rec });
                continue;
            }

            const today = new Date().toISOString().split('T')[0];
            if (rec.Attendance_Date > today) {
                results.push({ ok: false, error: 'Cannot mark attendance for future dates', rec });
                continue;
            }

            const ex = await Attendance.findOne({
                where: { Employee_ID: empId, Attendance_Date: rec.Attendance_Date }
            });
            const vals = {
                Check_In_Time: rec.Check_In_Time || null,
                Check_Out_Time: rec.Check_Out_Time || null,
                Total_Hours: rec.Total_Hours ?? null,
                Status: rec.Status,
                Is_Late: rec.Is_Late ?? false,
                Late_Minutes: rec.Late_Minutes ?? 0,
                Is_Overtime: rec.Is_Overtime ?? false,
                Overtime_Hours: rec.Overtime_Hours ?? 0,
                Marked_By: rec.Marked_By || 'Manual',
                Notes: rec.Notes || null,
                Cards_Produced: rec.Cards_Produced ?? 0,
                Created_By: rec.Created_By || null
            };
            if (ex) await ex.update(vals);
            else {
                await Attendance.create({
                    Employee_ID: empId,
                    Attendance_Date: rec.Attendance_Date,
                    ...vals
                });
            }
            results.push({ ok: true, Employee_ID: empId, Attendance_Date: rec.Attendance_Date });
        }

        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('bulkAttendance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Bulk attendance failed',
            error: error.message
        });
    }
};



module.exports = {
    getAttendance,
    bulkAttendance
};
