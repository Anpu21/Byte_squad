const express = require('express');
const router = express.Router();
const journalEntryController = require('../../controllers/Accounting&Finance/JournalEntryController');
const transactionCorrectionController = require('../../controllers/Accounting&Finance/TransactionCorrectionController');

// Get all journal entries
router.get('/', (req, res) => journalEntryController.getAllJournalEntries(req, res));

// Get transactions for correction (excludes revised ones)
router.get('/correction/list', (req, res) => transactionCorrectionController.getTransactionsForCorrection(req, res));

// Correct a transaction
router.post('/correction/submit', (req, res) => transactionCorrectionController.correctTransaction(req, res));

// Get journal entry details
router.get('/:id', (req, res) => journalEntryController.getJournalEntryDetails(req, res));

module.exports = router;
