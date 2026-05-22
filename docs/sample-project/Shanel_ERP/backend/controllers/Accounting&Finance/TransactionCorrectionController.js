const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/db');
const JournalEntry = require('../../models/finance/JournalEntry');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');
const AccountChart = require('../../models/finance/AccountChart');

class TransactionCorrectionController {
    // Get all transactions for correction
    async getTransactionsForCorrection(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await JournalEntry.findAndCountAll({
                where: {
                    Status: { [Op.ne]: 'Revised' } // Don't show already revised ones
                },
                include: [{
                    model: JournalEntryLine,
                    as: 'Lines',
                    include: [{
                        model: AccountChart,
                        as: 'Account',
                        attributes: ['Account_Name', 'Account_Code']
                    }]
                }],
                order: [['Entry_Date', 'DESC'], ['Journal_ID', 'DESC']],
                limit: limit,
                offset: offset,
                distinct: true
            });

            return res.status(200).json({
                success: true,
                data: rows,
                total: count,
                currentPage: page,
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            console.error('Error fetching transactions for correction:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Correct a transaction
    async correctTransaction(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { originalJournalID, correctedData } = req.body;
            // correctedData should contain: Entry_Date, Description, lines[]

            if (!originalJournalID || !correctedData || !correctedData.lines || correctedData.lines.length < 2) {
                throw new Error('Invalid correction data provided');
            }

            // 1. Fetch original journal entry
            const originalEntry = await JournalEntry.findOne({
                where: { Journal_ID: originalJournalID },
                include: [{ model: JournalEntryLine, as: 'Lines' }],
                transaction
            });

            if (!originalEntry) {
                throw new Error('Original journal entry not found');
            }

            if (originalEntry.Status === 'Revised') {
                throw new Error('This transaction has already been revised');
            }

            // 2. Reverse balances of the old entry
            for (const line of originalEntry.Lines) {
                await this.updateAccountBalance(
                    line.Account_ID,
                    -line.Debit_Amount, // Negative to reverse
                    -line.Credit_Amount, // Negative to reverse
                    transaction
                );
            }

            // 3. Mark old entry as Revised
            await originalEntry.update({ Status: 'Revised' }, { transaction });

            // 4. Create new Journal Entry (the Correction)
            const journalNumber = await this.generateJournalNumber('COR', transaction);
            
            const totalDebit = correctedData.lines.reduce((sum, line) => sum + parseFloat(line.Debit_Amount || 0), 0);
            const totalCredit = correctedData.lines.reduce((sum, line) => sum + parseFloat(line.Credit_Amount || 0), 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error('Total Debit must equal Total Credit');
            }

            const newJournalEntry = await JournalEntry.create({
                Journal_No: journalNumber,
                Entry_Date: correctedData.Entry_Date,
                Entry_Type: 'Adjustment',
                Reference_Type: 'Correction',
                Reference_ID: originalJournalID,
                Description: correctedData.Description,
                Total_Debit: totalDebit,
                Total_Credit: totalCredit,
                Status: 'Posted'
            }, { transaction });

            // 5. Create new lines and apply balances
            const newLines = correctedData.lines.map((line, index) => ({
                Journal_ID: newJournalEntry.Journal_ID,
                Account_ID: line.Account_ID,
                Line_Number: index + 1,
                Debit_Amount: line.Debit_Amount,
                Credit_Amount: line.Credit_Amount,
                Description: line.Description
            }));

            await JournalEntryLine.bulkCreate(newLines, { transaction });

            for (const line of newLines) {
                await this.updateAccountBalance(
                    line.Account_ID,
                    line.Debit_Amount,
                    line.Credit_Amount,
                    transaction
                );
            }

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: 'Transaction corrected successfully',
                data: {
                    newJournalId: newJournalEntry.Journal_ID,
                    newJournalNo: journalNumber
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error correcting transaction:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Helper: update account balance (copied from SalesAccountController)
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
        }

        await AccountChart.update(
            { Current_Balance: Sequelize.literal(`Current_Balance + ${balanceChange}`) },
            { where: { Account_ID: accountId }, transaction }
        );
    }

    // Helper: generate journal number
    async generateJournalNumber(prefix, transaction) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        const datePrefix = `${prefix}-${year}${month}${date}`;

        const lastEntry = await JournalEntry.findOne({
            where: {
                Journal_No: { [Op.like]: `${datePrefix}-%` }
            },
            order: [['Journal_ID', 'DESC']],
            attributes: ['Journal_No'],
            transaction
        });

        if (!lastEntry) {
            return `${datePrefix}-001`;
        }

        const lastNumber = parseInt(lastEntry.Journal_No.split('-').pop(), 10);
        const nextNumber = String(lastNumber + 1).padStart(3, '0');
        return `${datePrefix}-${nextNumber}`;
    }
}

module.exports = new TransactionCorrectionController();
