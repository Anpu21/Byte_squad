const {
    Payroll,
    Employee,
    AdvanceSalary,
    AdvanceRepayment
} = require('../../models/index');
const { findEmployeeByParam } = require('../../utils/hrEmployeeLookup');
const nodemailer = require('nodemailer');

// --- Payroll ---
/**
 * Fetches a list of payroll records.
 * Supports filtering by employeeId, year, month, and payment status via query parameters.
 * Returns records ordered by year and month descending.
 */
const getPayrolls = async (req, res) => {
    try {
        const { employeeId, year, month, status } = req.query;
        const where = {};
        if (employeeId) {
            const emp = await findEmployeeByParam(employeeId);
            if (!emp) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            where.Employee_ID = emp.Employee_ID;
        }
        if (year) where.Pay_Period_Year = parseInt(year, 10);
        if (month) where.Pay_Period_Month = parseInt(month, 10);
        if (status) where.Payment_Status = status;

        const rows = await Payroll.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: 'Employee',
                    attributes: ['Employee_ID', 'Employee_Code', 'Full_Name']
                }
            ],
            order: [
                ['Pay_Period_Year', 'DESC'],
                ['Pay_Period_Month', 'DESC']
            ]
        });

        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('getPayrolls error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payroll',
            error: error.message
        });
    }
};

/**
 * Saves a finalized payroll record to the database.
 * Validates that all required fields are present and prevents duplicate records for the same month/year/employee.
 */
const createPayroll = async (req, res) => {
    try {
        const body = req.body;
        if (
            !body.Employee_ID ||
            !body.Pay_Period_Month ||
            !body.Pay_Period_Year ||
            body.Gross_Salary == null ||
            body.Total_Deductions == null ||
            body.Net_Salary == null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Employee_ID, Pay_Period_Month, Pay_Period_Year, Gross_Salary, Total_Deductions, Net_Salary are required'
            });
        }

        const dup = await Payroll.findOne({
            where: {
                Employee_ID: body.Employee_ID,
                Pay_Period_Month: body.Pay_Period_Month,
                Pay_Period_Year: body.Pay_Period_Year
            }
        });
        if (dup) {
            return res.status(409).json({
                success: false,
                message: 'Payroll already exists for this employee and period'
            });
        }

        const created = await Payroll.create(body);
        return res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error('createPayroll error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create payroll',
            error: error.message
        });
    }
};

/**
 * Updates an existing payroll record (e.g., changing status to 'Paid').
 * Takes the payrollId from the URL and update data from the request body.
 */
const updatePayroll = async (req, res) => {
    try {
        const row = await Payroll.findByPk(req.params.payrollId);
        if (!row) {
            return res.status(404).json({ success: false, message: 'Payroll not found' });
        }

        const payload = { ...req.body };
        delete payload.Payroll_ID;
        delete payload.Generated_At;

        await row.update(payload);
        return res.status(200).json({ success: true, data: row });
    } catch (error) {
        console.error('updatePayroll error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update payroll',
            error: error.message
        });
    }
};

/**
 * EMAIL EXPORT:
 * Generates a paysheet report and emails it to a bank recipient.
 * Requires SMTP credentials in the .env file.
 * Attaches the payroll data as a base64 encoded PDF.
 */
const mailPayrollToBank = async (req, res) => {
    try {
        const { recipientEmail, bankName, month, year, pdfBase64, notes } = req.body;

        if (!recipientEmail || !pdfBase64) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email and PDF content are required'
            });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: EMAIL_USER or EMAIL_PASS is missing in .env'
            });
        }

        // Use the 'gmail' service shortcut for better reliability
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Shanel ERP - HR" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `Monthly Paysheet - ${bankName} - ${month}/${year}`,
            text: `Dear ${bankName} Team,\n\nPlease find attached the monthly paysheet for ${month}/${year}.\n\nNotes: ${notes || 'No additional notes.'}\n\nRegards,\nHR Management - Shanel ERP`,
            attachments: [
                {
                    filename: `Paysheet_${month}_${year}.pdf`,
                    content: pdfBase64.split('base64,')[1],
                    encoding: 'base64'
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Paysheet successfully mailed to the bank'
        });
    } catch (error) {
        console.error('mailPayrollToBank error:', error);
        let message = 'Failed to send email. Please check your SMTP configuration.';
        
        if (error.code === 'EAUTH') {
            message = 'Authentication failed. Please ensure you have entered a valid Google App Password in the .env file.';
        } else if (error.code === 'ESOCKET') {
            message = 'Network error. Could not connect to the email server.';
        }

        return res.status(500).json({
            success: false,
            message,
            error: error.message
        });
    }
};

module.exports = {
    getPayrolls,
    createPayroll,
    updatePayroll,
    mailPayrollToBank
};
