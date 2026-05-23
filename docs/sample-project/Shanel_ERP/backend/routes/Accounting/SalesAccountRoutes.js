const express = require('express');
const router = express.Router();
const SalesAccountController = require('../../controllers/Accounting&Finance/SalesAccountController');

const salesAccountController = new SalesAccountController();

// POST route to create sale entry
// Request body: { saleID: number, paymentMethod: string }
router.post('/create-sale-entry', (req, res) => {
    salesAccountController.createSaleEntry(req, res);
});

module.exports = router;
