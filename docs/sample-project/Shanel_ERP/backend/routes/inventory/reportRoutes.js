const express = require('express');
const router = express.Router();
const { getCurrentStockReport, getExpiryReport, getProductionReport, getPurchaseReport, getSupplierPurchaseReport, getTransferReport } = require('../../controllers/inventory/reportController');

router.get('/current-stock', getCurrentStockReport);
router.get('/expiry', getExpiryReport);
router.get('/production', getProductionReport);
router.get('/purchases', getPurchaseReport);
router.get('/supplier-purchases', getSupplierPurchaseReport);
router.get('/transfers', getTransferReport);

module.exports = router;