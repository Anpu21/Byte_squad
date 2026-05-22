const express = require('express');
const router = express.Router();
const ExpenseController = require('../../controllers/Accounting&Finance/ExpenseController');

const expenseController = new ExpenseController();

// POST - Create a new expense with journal entry
// Request body: { expenseDate, expenseCategory, expenseSubcategory, amount, paymentMethod, bankAccountId, paidTo, description, receiptNo }
router.post('/create', (req, res) => {
    expenseController.createExpense(req, res);
});

// GET - Get all expenses (with optional filters)
// Query params: ?status=Paid&category=Rent&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=50
router.get('/', (req, res) => {
    expenseController.getAllExpenses(req, res);
});

// GET - Get expense accounts for dropdown
router.get('/accounts', (req, res) => {
    expenseController.getExpenseAccounts(req, res);
});

// GET - Get bank accounts for dropdown
router.get('/bank-accounts', (req, res) => {
    expenseController.getBankAccounts(req, res);
});

// GET - Get single expense by ID
router.get('/:id', (req, res) => {
    expenseController.getExpenseById(req, res);
});

// PUT - Update expense status (approve/reject/cancel)
// Request body: { status: 'Approved' | 'Rejected' | 'Cancelled' }
router.put('/:id/status', (req, res) => {
    expenseController.updateExpenseStatus(req, res);
});

// DELETE - Cancel an expense (soft delete)
router.delete('/:id', (req, res) => {
    expenseController.deleteExpense(req, res);
});

module.exports = router;
