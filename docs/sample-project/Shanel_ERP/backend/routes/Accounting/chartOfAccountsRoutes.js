const express = require('express');
const router = express.Router();
const chartOfAccountsController = require('../../controllers/Accounting&Finance/ChartOfAccountsController');

// Get all accounts
router.get('/', (req, res) => chartOfAccountsController.getAllAccounts(req, res));

// Get account by code
router.get('/:code', (req, res) => chartOfAccountsController.getAccountByCode(req, res));

// Get next available code for type
router.get('/next-code/:type', (req, res) => chartOfAccountsController.getNextAccountCode(req, res));

// Create account
router.post('/create', (req, res) => chartOfAccountsController.createAccount(req, res));

// Get account ledger details
router.get('/ledger/:code', (req, res) => chartOfAccountsController.getAccountLedger(req, res));

module.exports = router;
