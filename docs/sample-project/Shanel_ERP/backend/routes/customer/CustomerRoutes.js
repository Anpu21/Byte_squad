const express = require('express');
const router = express.Router();
const {
	getAllCustomers,
	getCustomerById,
	searchCustomers,
	saveCustomer
} = require('../../controllers/customer/CustomerController');

router.get('/', getAllCustomers);
router.get('/search', searchCustomers);
router.get('/:id', getCustomerById);
router.post('/', saveCustomer);

module.exports = router;
