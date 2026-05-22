const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/db');
const Expense = require('../../models/finance/Expense');
const JournalEntry = require('../../models/finance/JournalEntry');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');
const AccountChart = require('../../models/finance/AccountChart');
const BankAccount = require('../../models/finance/BankAccount');
const { ACCOUNTS, PAYMENT_METHODS, EXPENSE_CATEGORY_ACCOUNTS } = require('../../constants/Accounting/AccConstants');

// Helper: Get today's date in local timezone as YYYY-MM-DD
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

class ExpenseController {

    // ─── CREATE EXPENSE ───────────────────────────────────────────────────────
    async createExpense(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                expenseDate,
                expenseCategory,
                expenseSubcategory,
                amount,
                paymentMethod,
                bankAccountId,
                paidTo,
                description,
                receiptNo,
                // Bank fields
                bankName,
                depositSlipNo,
                depositedBy,
                depositDate,
                // Cheque fields
                chequeNo,
                chequeBank,
                chequeDate
            } = req.body;

            // Validate required fields
            if (!expenseDate || !expenseCategory || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: expenseDate, expenseCategory, amount, paymentMethod'
                });
            }

            // Validate amount
            const expenseAmount = parseFloat(amount);
            if (isNaN(expenseAmount) || expenseAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number'
                });
            }

            // Get the expense account based on category
            let expenseAccountCode = EXPENSE_CATEGORY_ACCOUNTS[expenseCategory];
            let expenseAccount;

            if (expenseAccountCode) {
                expenseAccount = await AccountChart.findOne({
                    where: { Account_Code: expenseAccountCode },
                    transaction
                });
            } else {
                // Try dynamic lookup by account name if not found in hardcoded map
                expenseAccount = await AccountChart.findOne({
                    where: { 
                        Account_Name: expenseCategory,
                        Account_Type: 'Expense',
                        Is_Active: true
                    },
                    transaction
                });
            }

            if (!expenseAccount) {
                return res.status(400).json({
                    success: false,
                    message: `Expense account/category '${expenseCategory}' not found in ACCOUNT_CHART. Please create it first.`
                });
            }

            const creditAccount = await this.getCreditAccount(paymentMethod, transaction);

            // Build detailed description with payment method info
            let detailedDescription = description || `${expenseCategory} expense`;
            if (paymentMethod === 'Bank' && bankName) {
                detailedDescription += ` | Bank: ${bankName}, Slip: ${depositSlipNo || 'N/A'}, By: ${depositedBy || 'N/A'}, Date: ${depositDate || 'N/A'}`;
            } else if (paymentMethod === 'Cheque' && chequeNo) {
                detailedDescription += ` | Cheque: ${chequeNo}, Bank: ${chequeBank || 'N/A'}, Date: ${chequeDate || 'N/A'}`;
            }

            const allowedCategories = ['Salary', 'Rent', 'Utilities', 'Raw_Materials', 'Transport', 'Maintenance', 'Marketing', 'Office_Supplies', 'Other'];
            const dbCategory = allowedCategories.includes(expenseCategory) ? expenseCategory : 'Other';

            // Create the expense record
            const expense = await Expense.create({
                Expense_Date: expenseDate,
                Expense_Category: dbCategory,
                Expense_Subcategory: expenseSubcategory || null,
                Amount: expenseAmount,
                Payment_Method: paymentMethod,
                Bank_Account_ID: bankAccountId || null,
                Paid_To: paidTo || null,
                Description: detailedDescription,
                Receipt_No: receiptNo || null,
                Account_ID: expenseAccount.Account_ID,
                Status: 'Paid',
                Created_By: null,
                Created_At: new Date(),
                Updated_At: new Date()
            }, { transaction });

            // Create journal entry for this expense
            const journalResult = await this.createExpenseJournalEntry(
                expense,
                expenseAccount,
                creditAccount,
                expenseAmount,
                paymentMethod,
                transaction,
                expenseCategory
            );

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: 'Expense recorded successfully with accounting entries',
                data: {
                    expense: {
                        id: expense.Expense_ID,
                        date: expense.Expense_Date,
                        category: expense.Expense_Category,
                        amount: expenseAmount,
                        paymentMethod: expense.Payment_Method,
                        paidTo: expense.Paid_To,
                        status: expense.Status
                    },
                    journal: journalResult
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error creating expense:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while creating the expense',
                error: {
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            });
        }
    }


    // ─── CREATE JOURNAL ENTRY FOR EXPENSE ─────────────────────────────────────
    async createExpenseJournalEntry(expense, expenseAccount, creditAccount, amount, paymentMethod, transaction, originalCategory) {

        // Generate journal number
        const journalNumber = await this.generateJournalNumber('EXP-JE');

        // Prepare description
        const paymentMethodLabel = paymentMethod === 'Bank' ? 'Bank Payment' : paymentMethod;
        const categoryLabel = originalCategory || expense.Expense_Category;
        const description = `${paymentMethodLabel} - ${categoryLabel}${expense.Paid_To ? ` to ${expense.Paid_To}` : ''} - ${expense.Description || ''}`;

        // Create journal entry
        const journalEntry = await JournalEntry.create({
            Journal_No: journalNumber,
            Entry_Date: expense.Expense_Date,
            Entry_Type: 'Auto',
            Reference_Type: 'Expense',
            Reference_ID: expense.Expense_ID,
            Description: description.trim(),
            Total_Debit: amount,
            Total_Credit: amount,
            Status: 'Posted',
            Posted_By: null,
            Posted_Date: getLocalDateString(),
            Created_By: null
        }, { transaction });

        console.log('✓ Expense Journal Entry created with ID:', journalEntry.Journal_ID);

        // Build journal lines
        const journalLines = [];

        // Line 1: DEBIT - Expense Account (increases expense)
        journalLines.push({
            Journal_ID: journalEntry.Journal_ID,
            Account_ID: expenseAccount.Account_ID,
            Line_Number: 1,
            Debit_Amount: amount,
            Credit_Amount: 0,
            Description: `${categoryLabel} expense${expense.Paid_To ? ` - paid to ${expense.Paid_To}` : ''}`
        });

        // Line 2: CREDIT - Cash/Bank/Cheque Account (decreases asset)
        journalLines.push({
            Journal_ID: journalEntry.Journal_ID,
            Account_ID: creditAccount.Account_ID,
            Line_Number: 2,
            Debit_Amount: 0,
            Credit_Amount: amount,
            Description: `${paymentMethodLabel} for ${categoryLabel} expense${
                expense.Description.includes('|') ? ` (${expense.Description.split('|').slice(1).join('|').trim()})` : ''
            }`
        });

        // Insert all journal lines
        await JournalEntryLine.bulkCreate(journalLines, { transaction });

        // Update account balances
        for (const line of journalLines) {
            await this.updateAccountBalance(
                line.Account_ID,
                line.Debit_Amount,
                line.Credit_Amount,
                transaction
            );
        }

        return {
            journalId: journalEntry.Journal_ID,
            journalNo: journalNumber,
            totalDebit: parseFloat(amount.toFixed(2)),
            totalCredit: parseFloat(amount.toFixed(2)),
            lines: journalLines.map(line => ({
                account: line.Account_ID,
                debit: parseFloat(parseFloat(line.Debit_Amount).toFixed(2)),
                credit: parseFloat(parseFloat(line.Credit_Amount).toFixed(2)),
                description: line.Description
            }))
        };
    }


    // ─── GET ALL EXPENSES ─────────────────────────────────────────────────────
    async getAllExpenses(req, res) {
        try {
            const { status, category, startDate, endDate, page = 1, limit = 50 } = req.query;

            const whereClause = {};

            if (status) whereClause.Status = status;
            if (category) whereClause.Expense_Category = category;
            if (startDate && endDate) {
                whereClause.Expense_Date = {
                    [Op.between]: [startDate, endDate]
                };
            } else if (startDate) {
                whereClause.Expense_Date = { [Op.gte]: startDate };
            } else if (endDate) {
                whereClause.Expense_Date = { [Op.lte]: endDate };
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows: expenses } = await Expense.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: AccountChart,
                        as: 'ExpenseAccount',
                        attributes: ['Account_ID', 'Account_Code', 'Account_Name'],
                        required: false
                    },
                    {
                        model: BankAccount,
                        as: 'BankAccount',
                        attributes: ['Bank_Account_ID', 'Bank_Name', 'Account_Number'],
                        required: false
                    }
                ],
                order: [['Expense_Date', 'DESC'], ['Created_At', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            return res.status(200).json({
                success: true,
                data: expenses,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });

        } catch (error) {
            console.error('Error fetching expenses:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching expenses'
            });
        }
    }


    // ─── GET EXPENSE BY ID ────────────────────────────────────────────────────
    async getExpenseById(req, res) {
        try {
            const { id } = req.params;

            const expense = await Expense.findByPk(id, {
                include: [
                    {
                        model: AccountChart,
                        as: 'ExpenseAccount',
                        attributes: ['Account_ID', 'Account_Code', 'Account_Name'],
                        required: false
                    },
                    {
                        model: BankAccount,
                        as: 'BankAccount',
                        attributes: ['Bank_Account_ID', 'Bank_Name', 'Account_Number'],
                        required: false
                    }
                ]
            });

            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: expense
            });

        } catch (error) {
            console.error('Error fetching expense:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching the expense'
            });
        }
    }


    // ─── UPDATE EXPENSE STATUS ────────────────────────────────────────────────
    async updateExpenseStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['Pending', 'Approved', 'Paid', 'Rejected', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const expense = await Expense.findByPk(id);
            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            await expense.update({
                Status: status,
                Approved_Date: (status === 'Approved' || status === 'Paid') ? new Date() : expense.Approved_Date,
                Updated_At: new Date()
            });

            return res.status(200).json({
                success: true,
                message: `Expense status updated to ${status}`,
                data: expense
            });

        } catch (error) {
            console.error('Error updating expense status:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while updating the expense'
            });
        }
    }


    // ─── DELETE (CANCEL) EXPENSE ──────────────────────────────────────────────
    async deleteExpense(req, res) {
        try {
            const { id } = req.params;

            const expense = await Expense.findByPk(id);
            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            await expense.update({
                Status: 'Cancelled',
                Updated_At: new Date()
            });

            return res.status(200).json({
                success: true,
                message: 'Expense cancelled successfully'
            });

        } catch (error) {
            console.error('Error cancelling expense:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while cancelling the expense'
            });
        }
    }


    // ─── GET EXPENSE ACCOUNTS (for dropdown) ──────────────────────────────────
    async getExpenseAccounts(req, res) {
        try {
            const accounts = await AccountChart.findAll({
                where: {
                    Account_Type: 'Expense',
                    Is_Active: true
                },
                attributes: ['Account_ID', 'Account_Code', 'Account_Name'],
                order: [['Account_Code', 'ASC']]
            });

            return res.status(200).json({
                success: true,
                data: accounts
            });

        } catch (error) {
            console.error('Error fetching expense accounts:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching accounts'
            });
        }
    }


    // ─── GET BANK ACCOUNTS (for dropdown) ─────────────────────────────────────
    async getBankAccounts(req, res) {
        try {
            const bankAccounts = await BankAccount.findAll({
                where: { Status: 'Active' },
                attributes: ['Bank_Account_ID', 'Bank_Name', 'Account_Name', 'Account_Number', 'Branch'],
                order: [['Bank_Name', 'ASC']]
            });

            return res.status(200).json({
                success: true,
                data: bankAccounts
            });

        } catch (error) {
            console.error('Error fetching bank accounts:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching bank accounts'
            });
        }
    }


    // ─── HELPER: Get credit account based on payment method ───────────────────
    async getCreditAccount(paymentMethod, transaction) {
        const creditAccountMap = {
            'Cash': ACCOUNTS.CASH_IN_HAND,
            'Bank': ACCOUNTS.BANK_ACCOUNT_BOC,
            'Cheque': ACCOUNTS.CHEQUES_IN_HAND
        };

        const accountCode = creditAccountMap[paymentMethod];
        if (!accountCode) {
            throw new Error(`Unsupported payment method: ${paymentMethod}`);
        }

        const account = await AccountChart.findOne({
            where: { Account_Code: accountCode },
            transaction
        });

        if (!account) {
            throw new Error(`Account Code ${accountCode} not found in database for payment method: ${paymentMethod}. Please ensure all required accounts are created in AccountChart table.`);
        }

        return account;
    }


    // ─── HELPER: Update account balance ───────────────────────────────────────
    async updateAccountBalance(accountId, debitAmount, creditAmount, transaction) {
        const account = await AccountChart.findOne({
            where: { Account_ID: accountId },
            transaction
        });

        if (!account) {
            throw new Error(`Account ${accountId} not found`);
        }

        let balanceChange = 0;

        // Calculate balance change based on account type
        switch (account.Account_Type) {
            case 'Asset':
            case 'Expense':
                balanceChange = debitAmount - creditAmount;
                break;
            case 'Liability':
            case 'Equity':
            case 'Revenue':
                balanceChange = creditAmount - debitAmount;
                break;
        }

        // Update balance
        await AccountChart.update(
            {
                Current_Balance: Sequelize.literal(`Current_Balance + ${balanceChange}`)
            },
            {
                where: { Account_ID: accountId },
                transaction
            }
        );
    }


    // ─── HELPER: Generate journal number ──────────────────────────────────────
    async generateJournalNumber(prefix) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        const datePrefix = `${prefix}-${year}${month}${date}`;

        const lastEntry = await JournalEntry.findOne({
            where: {
                Journal_No: {
                    [Op.like]: `${datePrefix}-%`
                }
            },
            order: [['Journal_ID', 'DESC']],
            attributes: ['Journal_No']
        });

        if (!lastEntry) {
            return `${datePrefix}-001`;
        }

        const lastNumber = parseInt(lastEntry.Journal_No.split('-').pop(), 10);
        const nextNumber = String(lastNumber + 1).padStart(3, '0');
        return `${datePrefix}-${nextNumber}`;
    }
}

module.exports = ExpenseController;
