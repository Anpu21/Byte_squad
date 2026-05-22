const express = require('express');
const router = express.Router();
const IncomeController = require('../../controllers/Accounting&Finance/IncomeController');

const incomeController = new IncomeController();

// POST - Create an income record with journal entries
router.post('/create', (req, res) => {
    incomeController.createIncome(req, res);
});

// GET - Get all income records
router.get('/', (req, res) => {
    incomeController.getAllIncome(req, res);
});

// GET - Get revenue accounts for dropdown
router.get('/accounts', (req, res) => {
    incomeController.getIncomeAccounts(req, res);
});

// GET - Get income record by id
router.get('/:id', (req, res) => {
    incomeController.getIncomeById(req, res);
});

module.exports = router;
