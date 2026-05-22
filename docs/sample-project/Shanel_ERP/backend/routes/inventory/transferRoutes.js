const express = require('express');
const router = express.Router();
// Import the controller we wrote in the last step
const transferController = require('../../controllers/inventory/transferController');

// This tells the backend: "If someone asks for /history, run the getTransferHistory function"
router.get('/history', transferController.getTransferHistory);
router.post('/create', transferController.createTransfer);
router.put('/:ST_ID', transferController.updateTransfer);

module.exports = router;