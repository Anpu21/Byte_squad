const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/db');
const Expense = require('../../models/finance/Expense');
const JournalEntry = require('../../models/finance/JournalEntry');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');
const AccountChart = require('../../models/finance/AccountChart');
const Supplier = require('../../models/supplier/Supplier');
const SupplierTransaction = require('../../models/supplier/SupplierTransaction');
const { ACCOUNTS } = require('../../constants/Accounting/AccConstants');

// Helper: Get today's date in local timezone as YYYY-MM-DD
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

class SupplierPaymentController {

    // ─── PAY CREDIT TO SUPPLIER ──────────────────────────────────────────────
    async paySupplierCredit(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                supplierId,
                amount,
                paymentMethod,
                referenceNo,    // Bill/PO number
                supplierTransId, // Unique ID of the Credit_Taken transaction
                paymentDate,
                notes,
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

            // ── Validate required fields ──
            if (!supplierId || !amount || !paymentMethod || !supplierTransId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: supplierId, amount, paymentMethod, supplierTransId'
                });
            }

            const paymentAmount = parseFloat(amount);
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number'
                });
            }

            // ── Validate supplier exists ──
            const supplier = await Supplier.findByPk(supplierId, { transaction });
            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Supplier not found'
                });
            }

            const currentBalance = parseFloat(supplier.Current_Balance) || 0;
            if (currentBalance <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This supplier has no outstanding credit balance'
                });
            }

            if (paymentAmount > currentBalance) {
                return res.status(400).json({
                    success: false,
                    message: `Payment amount (${paymentAmount}) exceeds outstanding balance (${currentBalance})`
                });
            }

            // ── Validate supplierTransId matches a Credit_Taken transaction ──
            const creditTakenRecord = await SupplierTransaction.findOne({
                where: {
                    Supplier_Trans_ID: supplierTransId,
                    Transaction_Type: 'Credit_Taken'
                },
                transaction
            });

            if (!creditTakenRecord) {
                return res.status(404).json({
                    success: false,
                    message: `No credit transaction found with ID: ${supplierTransId}`
                });
            }

            // ── Calculate new running balance ──
            const newBalance = currentBalance - paymentAmount;

            // ── Build detailed notes ──
            let detailedNotes = notes || `Credit payment to supplier for bill ${referenceNo}`;
            if (paymentMethod === 'Bank' && bankName) {
                detailedNotes += ` | Bank: ${bankName}, Slip: ${depositSlipNo || 'N/A'}, Date: ${depositDate || 'N/A'}`;
            } else if (paymentMethod === 'Cheque' && chequeNo) {
                detailedNotes += ` | Cheque: ${chequeNo}, Bank: ${chequeBank || 'N/A'}, Date: ${chequeDate || 'N/A'}`;
            }

            // ── 1. Create Credit_Paid record ──
            const creditPaidRecord = await SupplierTransaction.create({
                Supplier_ID: supplierId,
                PO_ID: creditTakenRecord.PO_ID || null,
                Payment_ID: null,
                Transaction_Date: paymentDate || getLocalDateString(),
                Transaction_Type: 'Credit_Paid',
                Amount: paymentAmount,
                Running_Balance: newBalance,
                Reference_No: referenceNo,
                Notes: detailedNotes,
                Created_By: null
            }, { transaction });

            // ── 2. Update supplier's Current_Balance ──
            await Supplier.update(
                { Current_Balance: newBalance },
                { where: { S_ID: supplierId }, transaction }
            );

            // ── 3. Get accounting accounts for double-entry ──
            // DEBIT account: Accounts Payable (2001)
            const apAccount = await AccountChart.findOne({
                where: { Account_Code: ACCOUNTS.ACCOUNTS_PAYABLE },
                transaction
            });

            if (!apAccount) {
                throw new Error(`Accounts Payable account (${ACCOUNTS.ACCOUNTS_PAYABLE}) not found.`);
            }

            // CREDIT account: Cash/Bank (based on payment method)
            const creditAccount = await this.getCreditAccount(paymentMethod, transaction);

            // ── 4. Create Expense record ──
            const expense = await Expense.create({
                Expense_Date: paymentDate || getLocalDateString(),
                Expense_Category: 'Other', // Or a specific 'Debt Repayment' category
                Amount: paymentAmount,
                Paid_To: supplier.S_Name,
                Description: detailedNotes,
                Payment_Method: paymentMethod,
                Receipt_No: referenceNo,
                Account_ID: apAccount.Account_ID,
                Status: 'Paid',
                Created_By: null,
                Created_At: new Date()
            }, { transaction });

            // ── 5. Create Journal Entry (double-entry) ──
            const journalResult = await this.createSupplierPaymentJournalEntry(
                expense,
                supplier,
                apAccount,
                creditAccount,
                paymentAmount,
                paymentMethod,
                referenceNo,
                transaction
            );

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: `Payment of Rs. ${paymentAmount.toFixed(2)} to supplier processed successfully`,
                data: {
                    supplierTransaction: {
                        id: creditPaidRecord.Supplier_Trans_ID,
                        type: 'Credit_Paid',
                        amount: paymentAmount,
                        newBalance: newBalance,
                        referenceNo: referenceNo
                    },
                    expense: {
                        id: expense.Expense_ID,
                        amount: paymentAmount,
                        paidTo: supplier.S_Name
                    },
                    journal: journalResult
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error processing supplier payment:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while processing the payment'
            });
        }
    }

    // ─── GET SUPPLIER CREDIT INFO ─────────────────────────────────────────────
    async getSupplierCreditInfo(req, res) {
        try {
            const { id } = req.params;
            const supplier = await Supplier.findByPk(id, {
                attributes: ['S_ID', 'S_Code', 'S_Name', 'Phone_No', 'Credit_Limit', 'Current_Balance']
            });

            if (!supplier) {
                return res.status(404).json({ success: false, message: 'Supplier not found' });
            }

            const recentTransactions = await SupplierTransaction.findAll({
                where: { Supplier_ID: id },
                order: [['Created_At', 'DESC']],
                limit: 20
            });

            return res.status(200).json({
                success: true,
                data: { supplier, transactions: recentTransactions }
            });
        } catch (error) {
            console.error('Error fetching supplier credit info:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── GET OUTSTANDING BILLS ────────────────────────────────────────────────
    async getOutstandingBills(req, res) {
        try {
            const { supplierId } = req.params;

            const creditTaken = await SupplierTransaction.findAll({
                where: { Supplier_ID: supplierId, Transaction_Type: 'Credit_Taken' },
                attributes: ['Supplier_Trans_ID', 'Reference_No', 'Amount', 'Transaction_Date', 'Notes'],
                order: [['Transaction_Date', 'DESC']]
            });

            const creditPaid = await SupplierTransaction.findAll({
                where: { Supplier_ID: supplierId, Transaction_Type: 'Credit_Paid' },
                attributes: ['Reference_No', 'Amount']
            });

            const paidByBill = {};
            creditPaid.forEach(payment => {
                paidByBill[payment.Reference_No] = (paidByBill[payment.Reference_No] || 0) + parseFloat(payment.Amount);
            });

            const outstandingBills = creditTaken
                .map(ct => {
                    const totalAmount = parseFloat(ct.Amount);
                    const paidAmount = paidByBill[ct.Reference_No] || 0;
                    const remainingAmount = totalAmount - paidAmount;

                    return {
                        supplierTransId: ct.Supplier_Trans_ID,
                        referenceNo: ct.Reference_No,
                        totalAmount,
                        paidAmount,
                        remainingAmount,
                        transactionDate: ct.Transaction_Date
                    };
                })
                .filter(bill => bill.remainingAmount > 0);

            return res.status(200).json({ success: true, data: outstandingBills });
        } catch (error) {
            console.error('Error fetching outstanding bills:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── HELPER: Create journal entry ─────────────────────────────────────────
    async createSupplierPaymentJournalEntry(expense, supplier, apAccount, creditAccount, amount, paymentMethod, referenceNo, transaction) {
        const journalNumber = await this.generateJournalNumber('SPP-JE');
        const description = `Credit payment to ${supplier.S_Name} - Bill ${referenceNo} - ${paymentMethod}`;

        const journalEntry = await JournalEntry.create({
            Journal_No: journalNumber,
            Entry_Date: expense.Expense_Date,
            Entry_Type: 'Auto',
            Reference_Type: 'SupplierPayment',
            Reference_ID: expense.Expense_ID,
            Description: description,
            Total_Debit: amount,
            Total_Credit: amount,
            Status: 'Posted',
            Posted_By: null,
            Posted_Date: getLocalDateString(),
            Created_By: null
        }, { transaction });

        const journalLines = [
            {
                // DEBIT: Accounts Payable (Liability decreases)
                Journal_ID: journalEntry.Journal_ID,
                Account_ID: apAccount.Account_ID,
                Line_Number: 1,
                Debit_Amount: amount,
                Credit_Amount: 0,
                Description: `Accounts Payable cleared for bill ${referenceNo} to ${supplier.S_Name}`
            },
            {
                // CREDIT: Cash/Bank (Asset decreases)
                Journal_ID: journalEntry.Journal_ID,
                Account_ID: creditAccount.Account_ID,
                Line_Number: 2,
                Debit_Amount: 0,
                Credit_Amount: amount,
                Description: `${paymentMethod} payment to ${supplier.S_Name} for bill ${referenceNo}`
            }
        ];

        await JournalEntryLine.bulkCreate(journalLines, { transaction });

        for (const line of journalLines) {
            await this.updateAccountBalance(line.Account_ID, line.Debit_Amount, line.Credit_Amount, transaction);
        }

        return { journalId: journalEntry.Journal_ID, journalNo: journalNumber };
    }

    async getCreditAccount(paymentMethod, transaction) {
        const accountMap = {
            Cash: ACCOUNTS.CASH_IN_HAND,
            Bank: ACCOUNTS.BANK_ACCOUNT_BOC, // Default bank
            Cheque: ACCOUNTS.CHEQUES_IN_HAND
        };

        const accountCode = accountMap[paymentMethod];
        const account = await AccountChart.findOne({ where: { Account_Code: accountCode }, transaction });
        if (!account) throw new Error(`Account code ${accountCode} not found for ${paymentMethod}.`);
        return account;
    }

    async updateAccountBalance(accountId, debitAmount, creditAmount, transaction) {
        const account = await AccountChart.findByPk(accountId, { transaction });
        let balanceChange = 0;
        if (account.Account_Type === 'Asset' || account.Account_Type === 'Expense') {
            balanceChange = debitAmount - creditAmount;
        } else {
            balanceChange = creditAmount - debitAmount;
        }
        await AccountChart.update({ Current_Balance: Sequelize.literal(`Current_Balance + ${balanceChange}`) }, { where: { Account_ID: accountId }, transaction });
    }

    async generateJournalNumber(prefix) {
        const datePrefix = `${prefix}-${getLocalDateString().replace(/-/g, '')}`;
        const lastEntry = await JournalEntry.findOne({
            where: { Journal_No: { [Op.like]: `${datePrefix}-%` } },
            order: [['Journal_ID', 'DESC']]
        });
        const nextNumber = lastEntry ? String(parseInt(lastEntry.Journal_No.split('-').pop()) + 1).padStart(3, '0') : '001';
        return `${datePrefix}-${nextNumber}`;
    }
}

module.exports = new SupplierPaymentController();
