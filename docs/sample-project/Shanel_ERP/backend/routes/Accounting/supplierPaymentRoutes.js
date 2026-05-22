const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../../controllers/Accounting&Finance/SupplierPaymentController');
const Supplier = require('../../models/supplier/Supplier');

// Supplier Basic CRUD (Minimal for now)
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({ where: { Status: 'Active' } });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Credit Payment Routes
router.post('/pay-credit', (req, res) => supplierPaymentController.paySupplierCredit(req, res));
router.get('/info/:id', (req, res) => supplierPaymentController.getSupplierCreditInfo(req, res));
router.get('/bills/:supplierId', (req, res) => supplierPaymentController.getOutstandingBills(req, res));

module.exports = router;
