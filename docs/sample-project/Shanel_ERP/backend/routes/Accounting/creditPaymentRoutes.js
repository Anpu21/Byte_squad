const express = require('express');
const router = express.Router();
const CreditPaymentController = require('../../controllers/Accounting&Finance/CreditPaymentController');

const creditPaymentController = new CreditPaymentController();

// POST - Receive a credit payment from customer
router.post('/receive', (req, res) => {
    creditPaymentController.receiveCreditPayment(req, res);
});

// GET - Get credit info for a specific customer
router.get('/customer/:id', (req, res) => {
    creditPaymentController.getCustomerCreditInfo(req, res);
});

// GET - Get outstanding invoices for a customer
router.get('/invoices/:customerId', (req, res) => {
    creditPaymentController.getOutstandingInvoices(req, res);
});

module.exports = router;
