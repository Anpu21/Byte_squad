const express = require('express');
const router = express.Router();
const { getSalesStockOverwiew, getRecentStockIn, getRecentStockOut } = require('../../controllers/inventory/salesController');

router.get('/stock-overview', getSalesStockOverwiew);
router.get('/recent-stock-in', getRecentStockIn);
router.get('/recent-stock-out', getRecentStockOut);

module.exports = router;