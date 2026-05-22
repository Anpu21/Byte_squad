const { Sequelize, Op } = require('sequelize');
const AccountChart = require('../../models/finance/AccountChart');
const JournalEntry = require('../../models/finance/JournalEntry');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');

class ChartOfAccountsController {
    // Get all accounts
    async getAllAccounts(req, res) {
        try {
            const { type, active } = req.query;
            const whereClause = {};
            if (type) whereClause.Account_Type = type;
            if (active !== undefined) whereClause.Is_Active = active === 'true';

            // 1. Fetch all accounts
            const accounts = await AccountChart.findAll({
                where: whereClause,
                order: [['Account_Code', 'ASC']]
            });

            // 2. Fetch all balances using aggregation for performance
            const balances = await JournalEntryLine.findAll({
                attributes: [
                    'Account_ID',
                    [Sequelize.fn('SUM', Sequelize.literal('Debit_Amount - Credit_Amount')), 'Net_Balance']
                ],
                group: ['Account_ID']
            });

            // Create a lookup map for balances
            const balanceMap = {};
            balances.forEach(b => {
                balanceMap[b.Account_ID] = parseFloat(b.get('Net_Balance')) || 0;
            });

            // 3. Map balances to accounts and handle account-type specific logic
            const accountsWithBalances = accounts.map(account => {
                let netBalance = balanceMap[account.Account_ID] || 0;
                
                // Adjust sign based on account type
                // Liabilities, Equity, and Revenue accounts are credit-normal (Credit - Debit)
                if (['Liability', 'Equity', 'Revenue'].includes(account.Account_Type)) {
                    netBalance = -netBalance;
                }

                // Create a plain object to add the dynamic property
                const plainAccount = account.get({ plain: true });
                plainAccount.Current_Balance = netBalance.toFixed(2);
                return plainAccount;
            });

            return res.status(200).json({
                success: true,
                data: accountsWithBalances
            });
        } catch (error) {
            console.error('Error fetching accounts:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Create a new account
    async createAccount(req, res) {
        try {
            const {
                accountCode,
                accountName,
                accountType,
                accountCategory,
                parentAccountId,
                description,
                isActive
            } = req.body;

            // Basic validation
            if (!accountCode || !accountName || !accountType) {
                return res.status(400).json({
                    success: false,
                    message: 'Account code, name, and type are required'
                });
            }

            // Check if code already exists
            const existing = await AccountChart.findOne({ where: { Account_Code: accountCode } });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `Account code ${accountCode} already exists`
                });
            }

            const account = await AccountChart.create({
                Account_Code: accountCode,
                Account_Name: accountName,
                Account_Type: accountType,
                Account_Category: accountCategory || null,
                Parent_Account_ID: parentAccountId || null,
                Description: description || null,
                Is_Active: isActive !== undefined ? isActive : true,
                Created_At: new Date(),
                Updated_At: new Date()
            });

            return res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: account
            });
        } catch (error) {
            console.error('Error creating account:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get account by code
    async getAccountByCode(req, res) {
        try {
            const { code } = req.params;
            const account = await AccountChart.findOne({ where: { Account_Code: code } });
            
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: account
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get next available account code for a type
    async getNextAccountCode(req, res) {
        try {
            const { type } = req.params;
            
            // Define ranges based on typical accounting standards
            const ranges = {
                'Asset': { min: 1000, max: 1999 },
                'Liability': { min: 2000, max: 2999 },
                'Equity': { min: 3000, max: 3999 },
                'Revenue': { min: 4000, max: 4999 },
                'Expense': { min: 5000, max: 5999 }
            };

            const range = ranges[type] || { min: 6000, max: 9999 };

            const lastAccount = await AccountChart.findOne({
                where: {
                    Account_Code: {
                        [Op.between]: [range.min, range.max]
                    }
                },
                order: [['Account_Code', 'DESC']]
            });

            const nextCode = lastAccount ? (parseInt(lastAccount.Account_Code) + 1) : range.min;

            return res.status(200).json({
                success: true,
                nextCode: nextCode.toString()
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get account ledger details
    async getAccountLedger(req, res) {
        try {
            const { code } = req.params;
            const { startDate, endDate } = req.query;

            // 1. Get the account
            const account = await AccountChart.findOne({ 
                where: { Account_Code: code } 
            });

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // 2. Build transaction where clause
            const lineWhere = { Account_ID: account.Account_ID };
            const entryWhere = {};

            if (startDate && endDate) {
                entryWhere.Entry_Date = {
                    [Op.between]: [startDate, endDate]
                };
            }

            // 3. Get all transaction lines for this account
            const ledgerLines = await JournalEntryLine.findAll({
                where: lineWhere,
                include: [{
                    model: JournalEntry,
                    as: 'JournalEntry',
                    where: entryWhere,
                    attributes: ['Journal_No', 'Entry_Date', 'Description']
                }],
                order: [
                    [{ model: JournalEntry, as: 'JournalEntry' }, 'Entry_Date', 'ASC'],
                    ['Journal_ID', 'ASC']
                ]
            });

            // 4. Calculate totals and running balance
            let runningBalance = 0; 
            const transactions = ledgerLines.map(line => {
                const debit = parseFloat(line.Debit_Amount) || 0;
                const credit = parseFloat(line.Credit_Amount) || 0;
                
                if (['Asset', 'Expense'].includes(account.Account_Type)) {
                    runningBalance += (debit - credit);
                } else {
                    runningBalance += (credit - debit);
                }

                return {
                    date: line.JournalEntry.Entry_Date,
                    reference: line.JournalEntry.Journal_No,
                    description: line.Description || line.JournalEntry.Description,
                    debit: debit > 0 ? debit : '-',
                    credit: credit > 0 ? credit : '-',
                    runningBalance: runningBalance.toFixed(2)
                };
            });

            return res.status(200).json({
                success: true,
                data: {
                    account: {
                        name: account.Account_Name,
                        code: account.Account_Code,
                        type: account.Account_Type,
                        category: account.Account_Category,
                        currentBalance: runningBalance.toFixed(2) // Use calculated balance for accuracy
                    },
                    transactions: transactions // Chronological order
                }
            });

        } catch (error) {
            console.error('Error fetching account ledger:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new ChartOfAccountsController();
