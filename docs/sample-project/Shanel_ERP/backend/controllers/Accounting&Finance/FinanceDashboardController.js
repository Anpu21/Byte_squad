const { Sequelize, Op } = require('sequelize');
const Income = require('../../models/finance/Income');
const Expense = require('../../models/finance/Expense');
const AccountChart = require('../../models/finance/AccountChart');
const JournalEntryLine = require('../../models/finance/JournalEntryLine');

class FinanceReportController {

    // ── Profit & Loss Statement (Product Business - 3 Tier) ───────────────────
    async getProfitLoss(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const now = new Date();
            const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = endDate || now.toISOString().split('T')[0];

            // Get all Revenue accounts with their journal line totals
            const revenueAccounts = await AccountChart.findAll({
                where: { Account_Type: 'Revenue', Is_Active: true },
                include: [{
                    model: JournalEntryLine,
                    as: 'JournalLines',
                    attributes: ['Debit_Amount', 'Credit_Amount', 'Created_At'],
                    required: false,
                    where: { Created_At: { [Op.between]: [start + ' 00:00:00', end + ' 23:59:59'] } }
                }],
                order: [['Account_Code', 'ASC']]
            });

            // Get ALL expense accounts - we'll split them by category
            const expenseAccounts = await AccountChart.findAll({
                where: { Account_Type: 'Expense', Is_Active: true },
                include: [{
                    model: JournalEntryLine,
                    as: 'JournalLines',
                    attributes: ['Debit_Amount', 'Credit_Amount', 'Created_At'],
                    required: false,
                    where: { Created_At: { [Op.between]: [start + ' 00:00:00', end + ' 23:59:59'] } }
                }],
                order: [['Account_Code', 'ASC']]
            });

            // Helper: calculate net balance for an account
            const calcExpenseBalance = (acc) => {
                const total = (acc.JournalLines || []).reduce((sum, line) =>
                    sum + parseFloat(line.Debit_Amount || 0) - parseFloat(line.Credit_Amount || 0), 0);
                return Math.max(0, total);
            };

            const calcRevenueBalance = (acc) => {
                const total = (acc.JournalLines || []).reduce((sum, line) =>
                    sum + parseFloat(line.Credit_Amount || 0) - parseFloat(line.Debit_Amount || 0), 0);
                return Math.max(0, total);
            };

            // ── Revenues ─────────────────────────────────────────────────────
            // Separate Operating Revenue vs Other Income
            const operatingRevenue = revenueAccounts
                .filter(a => a.Account_Category === 'Operating Revenue')
                .map(a => ({ account_code: a.Account_Code, account_name: a.Account_Name, category: a.Account_Category, amount: calcRevenueBalance(a) }))
                .filter(r => r.amount > 0);

            const otherIncome = revenueAccounts
                .filter(a => a.Account_Category !== 'Operating Revenue')
                .map(a => ({ account_code: a.Account_Code, account_name: a.Account_Name, category: a.Account_Category, amount: calcRevenueBalance(a) }))
                .filter(r => r.amount > 0);

            const totalOperatingRevenue = operatingRevenue.reduce((s, r) => s + r.amount, 0);
            const totalOtherIncome = otherIncome.reduce((s, r) => s + r.amount, 0);
            const totalRevenue = totalOperatingRevenue + totalOtherIncome;

            // ── Cost of Goods Sold (COGS) ─────────────────────────────────────
            const cogs = expenseAccounts
                .filter(a => a.Account_Category === 'Direct Expense')
                .map(a => ({ account_code: a.Account_Code, account_name: a.Account_Name, category: a.Account_Category, amount: calcExpenseBalance(a) }))
                .filter(e => e.amount > 0);

            const totalCOGS = cogs.reduce((s, e) => s + e.amount, 0);

            // ── Gross Profit = Revenue - COGS ─────────────────────────────────
            const grossProfit = totalRevenue - totalCOGS;

            // ── Operating Expenses (all non-COGS, non-Contra) ──────────────────
            const operatingExpenses = expenseAccounts
                .filter(a => a.Account_Category === 'Operating Expense' || (!a.Account_Category || a.Account_Category === '-'))
                .map(a => ({ account_code: a.Account_Code, account_name: a.Account_Name, category: a.Account_Category, amount: calcExpenseBalance(a) }))
                .filter(e => e.amount > 0);

            const totalOperatingExpenses = operatingExpenses.reduce((s, e) => s + e.amount, 0);

            // ── Contra Revenue (Discounts, Returns etc.) ────────────────────────
            const contraRevenue = expenseAccounts
                .filter(a => a.Account_Category === 'Contra Revenue')
                .map(a => ({ account_code: a.Account_Code, account_name: a.Account_Name, category: a.Account_Category, amount: calcExpenseBalance(a) }))
                .filter(e => e.amount > 0);

            const totalContraRevenue = contraRevenue.reduce((s, e) => s + e.amount, 0);

            // ── Net Profit ────────────────────────────────────────────────────
            const totalExpenses = totalCOGS + totalOperatingExpenses + totalContraRevenue;
            const operatingProfit = grossProfit - totalOperatingExpenses;
            const netProfit = operatingProfit - totalContraRevenue;

            res.status(200).json({
                success: true,
                period: { start, end },
                data: {
                    operatingRevenue,
                    otherIncome,
                    cogs,
                    operatingExpenses,
                    contraRevenue,
                    totals: {
                        totalOperatingRevenue,
                        totalOtherIncome,
                        totalRevenue,
                        totalCOGS,
                        grossProfit,
                        totalOperatingExpenses,
                        operatingProfit,
                        totalContraRevenue,
                        netProfit,
                        totalExpenses,
                        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0,
                        grossMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0
                    }
                }
            });

        } catch (error) {
            console.error('P&L Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ── Balance Sheet ─────────────────────────────────────────────────────────────
    async getBalanceSheet(req, res) {
        try {
            const { asOfDate } = req.query;
            const date = asOfDate || new Date().toISOString().split('T')[0];

            const accounts = await AccountChart.findAll({
                where: { Account_Type: { [Op.in]: ['Asset', 'Liability', 'Equity'] }, Is_Active: true },
                include: [{
                    model: JournalEntryLine,
                    as: 'JournalLines',
                    attributes: ['Debit_Amount', 'Credit_Amount'],
                    required: false,
                    where: {
                        Created_At: { [Op.lte]: date + ' 23:59:59' }
                    }
                }],
                order: [['Account_Code', 'ASC']]
            });

            const data = {
                currentAssets: [],
                nonCurrentAssets: [],
                currentLiabilities: [],
                nonCurrentLiabilities: [],
                equity: [],
                totals: {
                    totalCurrentAssets: 0,
                    totalNonCurrentAssets: 0,
                    totalAssets: 0,
                    totalCurrentLiabilities: 0,
                    totalNonCurrentLiabilities: 0,
                    totalLiabilities: 0,
                    totalEquity: 0,
                    totalLiabilitiesAndEquity: 0
                }
            };

            accounts.forEach(acc => {
                const lines = acc.JournalLines || [];
                let balance = 0;

                if (acc.Account_Type === 'Asset') {
                    balance = lines.reduce((s, l) => s + parseFloat(l.Debit_Amount || 0) - parseFloat(l.Credit_Amount || 0), 0);
                    if (balance !== 0) {
                        const item = { account_name: acc.Account_Name, balance };
                        if (acc.Account_Category === 'Fixed Asset' || acc.Account_Category === 'Non-Current Asset') {
                            data.nonCurrentAssets.push(item);
                            data.totals.totalNonCurrentAssets += balance;
                        } else {
                            data.currentAssets.push(item);
                            data.totals.totalCurrentAssets += balance;
                        }
                    }
                } else if (acc.Account_Type === 'Liability') {
                    balance = lines.reduce((s, l) => s + parseFloat(l.Credit_Amount || 0) - parseFloat(l.Debit_Amount || 0), 0);
                    if (balance !== 0) {
                        const item = { account_name: acc.Account_Name, balance };
                        if (acc.Account_Category === 'Non-Current Liability') {
                            data.nonCurrentLiabilities.push(item);
                            data.totals.totalNonCurrentLiabilities += balance;
                        } else {
                            data.currentLiabilities.push(item);
                            data.totals.totalCurrentLiabilities += balance;
                        }
                    }
                } else if (acc.Account_Type === 'Equity') {
                    balance = lines.reduce((s, l) => s + parseFloat(l.Credit_Amount || 0) - parseFloat(l.Debit_Amount || 0), 0);
                    if (balance !== 0) {
                        data.equity.push({ account_name: acc.Account_Name, balance });
                        data.totals.totalEquity += balance;
                    }
                }
            });

            data.totals.totalAssets = data.totals.totalCurrentAssets + data.totals.totalNonCurrentAssets;
            data.totals.totalLiabilities = data.totals.totalCurrentLiabilities + data.totals.totalNonCurrentLiabilities;
            data.totals.totalLiabilitiesAndEquity = data.totals.totalLiabilities + data.totals.totalEquity;

            res.status(200).json({
                success: true,
                asOfDate: date,
                data
            });

        } catch (error) {
            console.error('Balance Sheet Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ── Dashboard Stats (unchanged) ──────────────────────────────────────────────
    async getDashboardStats(req, res) {
        try {
            const now = new Date();
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const [currentIncome, lastIncome, currentExpense, lastExpense] = await Promise.all([
                Income.sum('Amount', { where: { Income_Date: { [Op.gte]: currentMonthStart } } }),
                Income.sum('Amount', { where: { Income_Date: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
                Expense.sum('Amount', { where: { Expense_Date: { [Op.gte]: currentMonthStart } } }),
                Expense.sum('Amount', { where: { Expense_Date: { [Op.between]: [lastMonthStart, lastMonthEnd] } } })
            ]);

            const received = parseFloat(currentIncome) || 0;
            const prevReceived = parseFloat(lastIncome) || 0;
            const paid = parseFloat(currentExpense) || 0;
            const prevPaid = parseFloat(lastExpense) || 0;

            const receivedChange = prevReceived === 0 ? 100 : ((received - prevReceived) / prevReceived) * 100;
            const paidChange = prevPaid === 0 ? 100 : ((paid - prevPaid) / prevPaid) * 100;

            const cashFlow = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = d.toLocaleString('default', { month: 'short' });
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                const [inc, exp] = await Promise.all([
                    Income.sum('Amount', { where: { Income_Date: { [Op.between]: [start, end] } } }),
                    Expense.sum('Amount', { where: { Expense_Date: { [Op.between]: [start, end] } } })
                ]);
                cashFlow.push({ month: monthName, income: parseFloat(inc) || 0, expense: parseFloat(exp) || 0 });
            }

            const incomeDist = await Income.findAll({
                attributes: [
                    [Sequelize.col('IncomeAccount.Account_Name'), 'name'],
                    [Sequelize.fn('SUM', Sequelize.col('Amount')), 'total']
                ],
                include: [{ model: AccountChart, as: 'IncomeAccount', attributes: [], required: true }],
                group: ['IncomeAccount.Account_Name'],
                order: [[Sequelize.literal('total'), 'DESC']],
                limit: 5
            });

            const expenseDist = await Expense.findAll({
                attributes: [
                    [Sequelize.col('ExpenseAccount.Account_Name'), 'name'],
                    [Sequelize.fn('SUM', Sequelize.col('Amount')), 'total']
                ],
                include: [{ model: AccountChart, as: 'ExpenseAccount', attributes: [], required: true }],
                group: ['ExpenseAccount.Account_Name'],
                order: [[Sequelize.literal('total'), 'DESC']],
                limit: 5
            });

            res.status(200).json({
                success: true,
                summary: {
                    received: { amount: received, percentage: receivedChange.toFixed(1) },
                    paid: { amount: paid, percentage: paidChange.toFixed(1) },
                    net: { amount: received - paid, percentage: (receivedChange - paidChange).toFixed(1) }
                },
                cashFlow,
                distribution: {
                    income: incomeDist.map(d => ({ name: d.get('name'), value: parseFloat(d.get('total')) })),
                    expense: expenseDist.map(d => ({ name: d.get('name'), value: parseFloat(d.get('total')) }))
                }
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new FinanceReportController();
