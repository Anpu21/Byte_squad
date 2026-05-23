const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/db');
const Income = require('../../models/finance/Income');
const JournalEntry = require('../../models/finance/JournalEntry');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');
const AccountChart = require('../../models/finance/AccountChart');
const {
    ACCOUNTS,
    INCOME_CATEGORY_ACCOUNTS
} = require('../../constants/Accounting/AccConstants');

// Helper: Get today's date in local timezone as YYYY-MM-DD
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
class IncomeController {
    // Create income and its journal entry
    async createIncome(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                incomeDate,
                incomeCategory,
                amount,
                source,
                description,
                receiptNo,
                paymentMethod,
                // Bank Deposit fields
                bankName,
                depositSlipNo,
                depositedBy,
                depositDate,
                // Cheque fields
                chequeNo,
                chequeBank,
                chequeDate
            } = req.body;

            if (!incomeDate || !incomeCategory || !amount || !source || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Missing required fields: incomeDate, incomeCategory, amount, source, paymentMethod'
                });
            }

            const incomeAmount = parseFloat(amount);
            if (isNaN(incomeAmount) || incomeAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number'
                });
            }

            // Get the revenue account based on category
            let revenueAccountCode = INCOME_CATEGORY_ACCOUNTS[incomeCategory];
            let revenueAccount;

            if (revenueAccountCode) {
                revenueAccount = await AccountChart.findOne({
                    where: { Account_Code: revenueAccountCode },
                    transaction
                });
            } else {
                // Try dynamic lookup by account name if not found in hardcoded map
                revenueAccount = await AccountChart.findOne({
                    where: { 
                        Account_Name: incomeCategory,
                        Account_Type: 'Revenue',
                        Is_Active: true
                    },
                    transaction
                });
            }

            if (!revenueAccount) {
                return res.status(400).json({
                    success: false,
                    message: `Income account/category '${incomeCategory}' not found in ACCOUNT_CHART. Please create it first.`
                });
            }

            const debitAccount = await this.getDebitAccount(paymentMethod, transaction);

            // Build detailed description with payment method info
            let detailedDescription = description || '';
            if (paymentMethod === 'Bank_Deposit' && bankName) {
                detailedDescription += `${detailedDescription ? ' | ' : ''}Bank: ${bankName}, Slip: ${depositSlipNo || 'N/A'}, By: ${depositedBy || 'N/A'}, Date: ${depositDate || 'N/A'}`;
            } else if (paymentMethod === 'Cheque' && chequeNo) {
                detailedDescription += `${detailedDescription ? ' | ' : ''}Cheque: ${chequeNo}, Bank: ${chequeBank || 'N/A'}, Date: ${chequeDate || 'N/A'}`;
            }

            const allowedCategories = ['Sales', 'Interest', 'Commission', 'Other'];
            const dbCategory = allowedCategories.includes(incomeCategory) ? incomeCategory : 'Other';

            const income = await Income.create(
                {
                    Income_Date: incomeDate,
                    Income_Category: dbCategory,
                    Amount: incomeAmount,
                    Source: source,
                    Description: detailedDescription || null,
                    Receipt_No: receiptNo || null,
                    Account_ID: revenueAccount.Account_ID,
                    Created_By: null,
                    Created_At: new Date()
                },
                { transaction }
            );

            const journal = await this.createIncomeJournalEntry(
                income,
                revenueAccount,
                debitAccount,
                incomeAmount,
                paymentMethod,
                transaction,
                incomeCategory
            );

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: 'Income recorded successfully with accounting entries',
                data: {
                    income: {
                        id: income.Income_ID,
                        date: income.Income_Date,
                        category: income.Income_Category,
                        amount: incomeAmount,
                        source: income.Source,
                        receiptNo: income.Receipt_No
                    },
                    journal
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error creating income:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while creating income'
            });
        }
    }

    async getAllIncome(req, res) {
        try {
            const { category, startDate, endDate, page = 1, limit = 50 } = req.query;
            const whereClause = {};

            if (category) whereClause.Income_Category = category;

            if (startDate && endDate) {
                whereClause.Income_Date = {
                    [Op.between]: [startDate, endDate]
                };
            } else if (startDate) {
                whereClause.Income_Date = { [Op.gte]: startDate };
            } else if (endDate) {
                whereClause.Income_Date = { [Op.lte]: endDate };
            }

            const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

            const { count, rows } = await Income.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: AccountChart,
                        as: 'IncomeAccount',
                        attributes: ['Account_ID', 'Account_Code', 'Account_Name'],
                        required: false
                    }
                ],
                order: [['Income_Date', 'DESC'], ['Created_At', 'DESC']],
                limit: parseInt(limit, 10),
                offset
            });

            return res.status(200).json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    totalPages: Math.ceil(count / parseInt(limit, 10))
                }
            });
        } catch (error) {
            console.error('Error fetching income:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching income records'
            });
        }
    }

    async getIncomeById(req, res) {
        try {
            const { id } = req.params;

            const income = await Income.findByPk(id, {
                include: [
                    {
                        model: AccountChart,
                        as: 'IncomeAccount',
                        attributes: ['Account_ID', 'Account_Code', 'Account_Name'],
                        required: false
                    }
                ]
            });

            if (!income) {
                return res.status(404).json({
                    success: false,
                    message: 'Income record not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: income
            });
        } catch (error) {
            console.error('Error fetching income by id:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching income record'
            });
        }
    }

    async getIncomeAccounts(req, res) {
        try {
            const accounts = await AccountChart.findAll({
                where: {
                    Account_Type: 'Revenue',
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
            console.error('Error fetching income accounts:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while fetching income accounts'
            });
        }
    }

    async createIncomeJournalEntry(income, revenueAccount, debitAccount, amount, paymentMethod, transaction, originalCategory) {
        const journalNumber = await this.generateJournalNumber('INC-JE');

        // Map payment method to a readable label for journal descriptions
        const paymentMethodLabel = paymentMethod === 'Bank_Deposit' ? 'Bank Deposit' : paymentMethod;

        const categoryLabel = originalCategory || income.Income_Category;
        const description = `${paymentMethodLabel} income - ${categoryLabel} from ${income.Source}${
            income.Description ? ` - ${income.Description}` : ''
        }`;

        const journalEntry = await JournalEntry.create(
            {
                Journal_No: journalNumber,
                Entry_Date: income.Income_Date,
                Entry_Type: 'Auto',
                Reference_Type: 'Income',
                Reference_ID: income.Income_ID,
                Description: description,
                Total_Debit: amount,
                Total_Credit: amount,
                Status: 'Posted',
                Posted_By: null,
                Posted_Date: getLocalDateString(),
                Created_By: null
            },
            { transaction }
        );

        // Double-entry journal lines:
        // DEBIT: Asset account (Cash/Bank/Cheques In Hand) — money received
        // CREDIT: Revenue account — income recognized
        const journalLines = [
            {
                Journal_ID: journalEntry.Journal_ID,
                Account_ID: debitAccount.Account_ID,
                Line_Number: 1,
                Debit_Amount: amount,
                Credit_Amount: 0,
                Description: `${paymentMethodLabel} received from ${income.Source}`
            },
            {
                Journal_ID: journalEntry.Journal_ID,
                Account_ID: revenueAccount.Account_ID,
                Line_Number: 2,
                Debit_Amount: 0,
                Credit_Amount: amount,
                Description: `${categoryLabel} income recognized`
            }
        ];

        await JournalEntryLine.bulkCreate(journalLines, { transaction });

        // Update account balances for double-entry
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
            lines: journalLines.map((line) => ({
                account: line.Account_ID,
                debit: parseFloat(parseFloat(line.Debit_Amount).toFixed(2)),
                credit: parseFloat(parseFloat(line.Credit_Amount).toFixed(2)),
                description: line.Description
            }))
        };
    }

    // Maps payment methods to their corresponding Chart of Accounts debit account
    // Bank_Deposit → Bank Account (1002): DR Bank Account, CR Revenue
    // Cheque → Cheques In Hand (1005): DR Cheques In Hand, CR Revenue
    // Cash → Cash In Hand (1001): DR Cash In Hand, CR Revenue
    async getDebitAccount(paymentMethod, transaction) {
        const debitAccountMap = {
            Cash: ACCOUNTS.CASH_IN_HAND,
            Bank_Deposit: ACCOUNTS.BANK_ACCOUNT_BOC,
            Cheque: ACCOUNTS.CHEQUES_IN_HAND
        };

        const accountCode = debitAccountMap[paymentMethod];
        if (!accountCode) {
            throw new Error(`Unsupported payment method: ${paymentMethod}. Valid methods are: Cash, Bank_Deposit, Cheque`);
        }

        const account = await AccountChart.findOne({
            where: { Account_Code: accountCode },
            transaction
        });

        if (!account) {
            throw new Error(
                `Account code ${accountCode} not found for payment method ${paymentMethod}. Please seed required chart-of-account records.`
            );
        }

        return account;
    }

    async updateAccountBalance(accountId, debitAmount, creditAmount, transaction) {
        const account = await AccountChart.findOne({
            where: { Account_ID: accountId },
            transaction
        });

        if (!account) {
            throw new Error(`Account ${accountId} not found`);
        }

        let balanceChange = 0;

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
            default:
                balanceChange = 0;
        }

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

module.exports = IncomeController;
