const FiscalPeriod = require('../../models/finance/FiscalPeriod');

class FiscalPeriodController {
    // Get all fiscal periods
    async getAllPeriods(req, res) {
        try {
            const periods = await FiscalPeriod.findAll({
                order: [['Start_Date', 'DESC']]
            });
            return res.status(200).json({
                success: true,
                data: periods
            });
        } catch (error) {
            console.error('Error fetching fiscal periods:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Create a new fiscal period
    async createPeriod(req, res) {
        try {
            const { name, start, end, status } = req.body;
            const period = await FiscalPeriod.create({
                Period_Name: name,
                Start_Date: start,
                End_Date: end,
                Status: status || 'OPEN'
            });
            return res.status(201).json({
                success: true,
                data: period
            });
        } catch (error) {
            console.error('Error creating fiscal period:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update period status
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const period = await FiscalPeriod.findByPk(id);
            if (!period) {
                return res.status(404).json({
                    success: false,
                    message: 'Period not found'
                });
            }

            period.Status = status;
            await period.save();

            return res.status(200).json({
                success: true,
                message: `Period status updated to ${status}`
            });
        } catch (error) {
            console.error('Error updating period status:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new FiscalPeriodController();
