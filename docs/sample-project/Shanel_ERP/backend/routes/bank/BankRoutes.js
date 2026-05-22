const express = require('express');
const router = express.Router();
const Bank = require('../../models/Bank/Bank');
const Branch = require('../../models/Bank/Branch');

// Get all banks
router.get('/banks', async (req, res) => {
    try {
        const banks = await Bank.findAll({ order: [['bank_name', 'ASC']] });
        res.json(banks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get branches for a specific bank
router.get('/banks/:bank_id/branches', async (req, res) => {
    try {
        const branches = await Branch.findAll({
            where: { bank_id: req.params.bank_id },
            order: [['branch_name', 'ASC']]
        });
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
