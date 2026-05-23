const express = require('express');
const router = express.Router();
const productionController = require('../../controllers/inventory/productionController');

//Define endpoint
router.get('/stock-overview', productionController.getProductionData);
router.post('/start', productionController.startProduction);
router.put('/update/:id', productionController.updateProductionStatus);
router.delete('/:id', productionController.deleteProduction);

module.exports = router;