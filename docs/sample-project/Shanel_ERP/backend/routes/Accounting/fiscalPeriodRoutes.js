const express = require('express');
const router = express.Router();
const fiscalPeriodController = require('../../controllers/Accounting&Finance/FiscalPeriodController');

router.get('/', (req, res) => fiscalPeriodController.getAllPeriods(req, res));
router.post('/', (req, res) => fiscalPeriodController.createPeriod(req, res));
router.put('/:id/status', (req, res) => fiscalPeriodController.updateStatus(req, res));

module.exports = router;
