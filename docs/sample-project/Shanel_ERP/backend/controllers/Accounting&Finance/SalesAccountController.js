const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../config/db');
const Sale = require('../../models/sales/Sales');
const SaleItem = require('../../models/sales/SalesItem');
const Product = require('../../models/inventory/Product');
const Customer = require('../../models/customer/customer');
const JournalEntry = require('../../models/finance/JournalEntry');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');
const AccountChart = require('../../models/finance/AccountChart');
const { ACCOUNTS, PAYMENT_METHODS } = require('../../constants/Accounting/AccConstants');


//register associations
Sale.belongsTo(Customer, { foreignKey: 'C_ID' });
SaleItem.belongsTo(Sale, { foreignKey: 'P_ID' });

class SalesAccountController {
    async createSaleEntry(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { saleID, paymentMethod } = req.body;

            //validate input
            if (!saleID || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: saleID and paymentMethod'
                });
            }

            //get sale data
            const saleData = await this.getSaleDataForAccounting(saleID);
            if (!saleData) {
                return res.status(404).json({
                    success: false,
                    message: 'Sale not found for the given saleID'
                });
            }

            //get total Cost of Goods Sold (COGS) for the sale
            const totalCOGS = await this.getSaleItemsForCOGS(saleID);
            console.log('Total COGS for the sale:', totalCOGS);

            //create journal entry for the sale
            const journalResult = await this.createSaleJournalEntry(
                saleData,
                totalCOGS,
                paymentMethod,
                transaction
            );

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: 'Accounting entries created successfully',
                data: journalResult
            });



        } catch (error) {
            await transaction.rollback();
            console.error('Error creating sale entry:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while creating the sale entry',
                error: {
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            });
        }
    }



    //create journal entry for the sale
    async createSaleJournalEntry(saleData, totalCOGS, paymentMethod, transaction) {

        //get debit account based on payment method
        const debitAccount = await this.getDebitAccount(paymentMethod, transaction);


        //get credit account based on sale type
        const revenueAccountCode = saleData.Sale_Type === 'Retail'
            ? ACCOUNTS.SALES_REVENUE_RETAIL
            : ACCOUNTS.SALES_REVENUE_WHOLESALE;


        const revenueAccount = await AccountChart.findOne({
            where: { Account_Code: revenueAccountCode }
        });
        if (!revenueAccount) {
            throw new Error(`Revenue account not found! ` +
                `Sale Type: ${saleData.Sale_Type}, ` +
                `Expected Account Code: ${revenueAccountCode}. ` +
                `Please ensure account exists in ACCOUNT_CHART table.`);
        }


        // Fetch all other accounts needed
        const discountAccount = await AccountChart.findOne({
            where: { Account_Code: ACCOUNTS.DISCOUNT_GIVEN }
        });


        //get COGS 
        const cogsAccount = await AccountChart.findOne({
            where: { Account_Code: ACCOUNTS.COGS }
        });

        //get inventory account
        const inventoryAccount = await AccountChart.findOne({
            where: { Account_Code: ACCOUNTS.INVENTORY }
        });



        if (!discountAccount) {
            throw new Error(`Discount account (${ACCOUNTS.DISCOUNT_GIVEN}) not found in ACCOUNT_CHART`);
        }
        if (!cogsAccount) {
            throw new Error(`COGS account (${ACCOUNTS.COGS}) not found in ACCOUNT_CHART`);
        }
        if (!inventoryAccount) {
            throw new Error(`Inventory account (${ACCOUNTS.INVENTORY}) not found in ACCOUNT_CHART`);
        }

        //parse amounts
        const totalAmount = parseFloat(saleData.Total_Amount); //what customer pays
        const discountAmount = parseFloat(saleData.Discount_Amount) || 0; //discount given
        const subtotalAmount = parseFloat(saleData.Subtotal); //before discount
        const cogs = parseFloat(totalCOGS); //cost of goods sold




        //calculate totals 
        const totalDebit = totalAmount + cogs + discountAmount; //what customer pays + cost of goods sold
        const totalCredit = subtotalAmount + cogs; //sales revenue + COGS



        //verify balanced
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Journal entry is not balanced! ` +
                `Total Debit: ${totalDebit}, Total Credit: ${totalCredit}, ` +
                `Difference: ${Math.abs(totalDebit - totalCredit)}`);
        }



        //generate a journal number 
        const journalNumber = await this.generateJournalNumber('SALE-JE-');


        //prepare journal description
        const customerName = saleData.Customer ? saleData.Customer.C_Name : 'Unknown Customer';
        const description = `${paymentMethod} ${saleData.Sale_Type} sale to ${customerName} - ${saleData.Invoice_No}`;


        //create journal entry
        const journalEntry = await JournalEntry.create({
            Journal_No: journalNumber,
            Entry_Date: saleData.Sale_Date,
            Entry_Type: 'Auto',
            Reference_Type: 'Sale',
            Reference_ID: saleData.Sale_ID,
            Description: description,
            Total_Debit: totalDebit,
            Total_Credit: totalCredit,
            Status: 'Posted',
            Posted_By: null,
            Posted_Date: new Date(),
            Created_By: null

        }, { transaction });
        console.log('✓ Journal Entry created with ID:', journalEntry.Journal_ID);



        //build journal entry lines
        const journalLines = [];

        //Line 1: Debit - Cash/Bank/Receivable
        journalLines.push({
            Journal_ID: journalEntry.Journal_ID,
            Account_ID: debitAccount.Account_ID,
            Line_Number: 1,
            Debit_Amount: totalAmount,
            Credit_Amount: 0,
            Description: `${paymentMethod} received from ${customerName}`,
        });

        //Line 2: Debit - Discount Given (if applicable)
        if (discountAmount > 0) {
            journalLines.push({
                Journal_ID: journalEntry.Journal_ID,
                Account_ID: discountAccount.Account_ID,
                Line_Number: 2,
                Debit_Amount: discountAmount,
                Credit_Amount: 0,
                Description: `${saleData.Discount_percentage}% Discount given to ${customerName} `
            });
        }

        //Line 3: Credit - Sales Revenue
        const lineNumber = discountAmount > 0 ? 3 : 2; //adjust line number if discount line exists
        journalLines.push({
            Journal_ID: journalEntry.Journal_ID,
            Account_ID: revenueAccount.Account_ID,
            Line_Number: lineNumber,
            Debit_Amount: 0,
            Credit_Amount: subtotalAmount,
            Description: `Sales revenue for ${customerName}`
        });

        //Line 4: Debit - COGS
        journalLines.push({
            Journal_ID: journalEntry.Journal_ID,
            Account_ID: cogsAccount.Account_ID,
            Line_Number: lineNumber + 1,
            Debit_Amount: cogs,
            Credit_Amount: 0,
            Description: `Cost of goods sold for ${customerName}`
        });

        //Line 5: Credit - Inventory (to reduce inventory)
        journalLines.push({
            Journal_ID: journalEntry.Journal_ID,
            Account_ID: inventoryAccount.Account_ID,
            Line_Number: lineNumber + 2,
            Debit_Amount: 0,
            Credit_Amount: cogs,
            Description: `Reduce inventory for ${customerName}`
        });



        //Insert all journal lines
        await JournalEntryLine.bulkCreate(journalLines, { transaction });


        //update account balances
        for (const line of journalLines) {
            await this.updateAccountBalance(
                line.Account_ID,
                line.Debit_Amount,
                line.Credit_Amount,
                transaction
            );
        }


        //Link journal to sale 
        await Sale.update(
            { Journal_ID: journalEntry.Journal_ID },
            { where: { Sale_ID: saleData.Sale_ID }, transaction }
        );


        return {
            journalId: journalEntry.Journal_ID,
            journalNo: journalNumber,
            totalDebit: parseFloat(totalDebit.toFixed(2)),
            totalCredit: parseFloat(totalCredit.toFixed(2)),
            lines: journalLines.map(line => ({
                account: line.Account_ID,
                debit: parseFloat(parseFloat(line.Debit_Amount).toFixed(2)),
                credit: parseFloat(parseFloat(line.Credit_Amount).toFixed(2)),
                description: line.Description
            }))
        };
    }



    //update account balance
    async updateAccountBalance(accountId, debitAmount, creditAmount, transaction) {
        const account = await AccountChart.findOne({
            where: { Account_ID: accountId },
            transaction
        });

        if (!account) {
            throw new Error(`Account ${accountId} not found`);

        }

        let balanceChange = 0;

        //calculate balance change based on account type
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

        //update balance
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


    //get sale data for accounting
    async getSaleDataForAccounting(saleID) {
        return await Sale.findOne({
            where: { Sale_ID: saleID },
            include: [
                {
                    model: Customer,
                    attributes: ['C_ID', 'C_Name', 'Customer_Type'],
                    required: false
                }
            ]
        });
    }


    //get sale items for COGS calculation
    async getSaleItemsForCOGS(saleID) {
        const result = await SaleItem.findOne({
            where: { Sale_ID: saleID },
            attributes: [
                [Sequelize.fn(
                    'SUM',
                    Sequelize.literal('`SaleItem`.`Base_Unit_Qty` * `Product`.`Cost_Price`')
                ),
                    'totalCOGS'
                ]
            ],
            include: [
                {
                    model: Product,
                    attributes: [],
                    required: false
                }
            ],
            raw: true
        });
        return parseFloat(result?.totalCOGS ?? 0);

    }



    //get debit account based on payment method
    async getDebitAccount(paymentMethod, transaction) {
        // Normalize payment method for case-insensitive matching
        let normalizedMethod = paymentMethod;
        if (paymentMethod && paymentMethod.length > 0) {
            normalizedMethod = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1).toLowerCase();
        }

        const debitAccountMap = {
            [PAYMENT_METHODS.CASH]: ACCOUNTS.CASH_IN_HAND,
            [PAYMENT_METHODS.CREDIT]: ACCOUNTS.ACCOUNTS_RECEIVABLE,
            [PAYMENT_METHODS.BANK]: ACCOUNTS.BANK_ACCOUNT_BOC,
            [PAYMENT_METHODS.BANK_DEPOSIT]: ACCOUNTS.BANK_ACCOUNT_BOC,
            [PAYMENT_METHODS.CHEQUE]: ACCOUNTS.CHEQUES_IN_HAND,
            [PAYMENT_METHODS.CARD]: ACCOUNTS.BANK_ACCOUNT_BOC,
            'Cash': ACCOUNTS.CASH_IN_HAND,
            'Bank': ACCOUNTS.BANK_ACCOUNT_BOC
        };

        const accountCode = debitAccountMap[normalizedMethod] || debitAccountMap[paymentMethod];
        if (!accountCode) {
            throw new Error(`Unsupported payment method: ${paymentMethod}`);
        }

        const account = await AccountChart.findOne({
            where: { Account_Code: accountCode },
            transaction
        });

        if (!account) {
            throw new Error(`Account Code ${accountId} not found in database for payment method: ${paymentMethod}. Please ensure all required accounts are created in AccountChart table.`);
        }

        return account;
    }

    //generate journal number
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

module.exports = SalesAccountController;
