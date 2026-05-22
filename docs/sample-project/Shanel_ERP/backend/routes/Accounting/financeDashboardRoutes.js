const express = require('express');
const router = express.Router();
const financeReportController = require('../../controllers/Accounting&Finance/FinanceDashboardController');

router.get('/stats', (req, res) => financeReportController.getDashboardStats(req, res));
router.get('/profit-loss', (req, res) => financeReportController.getProfitLoss(req, res));
router.get('/balance-sheet', (req, res) => financeReportController.getBalanceSheet(req, res));

module.exports = router;
