const express = require("express");
const path = require("path");
require('dotenv').config();

if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("Authentication secrets (JWT_SECRET or REFRESH_TOKEN_SECRET) are not configured. Add them to backend/.env as described in AUTH_SETUP.md.");
}

/** Load Sequelize models & associations before routes so HR/inventory use one shared registry */
require('./models');

const applyMiddleware = require('./middleware/appMiddleware');
const inventoryRoutes = require('./routes/inventory/inventory');
const productionRoutes = require('./routes/inventory/productionRoutes');
const customerRoutes = require('./routes/customer/CustomerRoutes');
const inventorySalesRoutes = require('./routes/inventory/salesRoutes');
const productSalesRoutes = require('./routes/sales/SalesRoutes');
const transferRoutes = require('./routes/inventory/transferRoutes');
const reportRoutes = require('./routes/inventory/reportRoutes');
const accountingRoutes = require('./routes/Accounting/SalesAccountRoutes');
const expenseRoutes = require('./routes/Accounting/expenseRoutes');
const incomeRoutes = require('./routes/Accounting/incomeRoutes');
const creditPaymentRoutes = require('./routes/Accounting/creditPaymentRoutes');
const supplierPaymentRoutes = require('./routes/Accounting/supplierPaymentRoutes');
const chartOfAccountsRoutes = require('./routes/Accounting/chartOfAccountsRoutes');
const journalEntryRoutes = require('./routes/Accounting/journalEntryRoutes');
const fiscalPeriodRoutes = require('./routes/Accounting/fiscalPeriodRoutes');
const financeDashboardRoutes = require('./routes/Accounting/financeDashboardRoutes');
const bankRoutes = require('./routes/bank/BankRoutes');
const salesManagementRoutes = require('./routes/saleManagement/SaleManagementRoute');
const databaseCon = require('./config/db');
const seedBanks = require('./scripts/seedBanks');
const seedProducts = require('./scripts/seedProducts');
const hrRoutes = require('./routes/hr/hrRoutes');
const userRoutes = require('./routes/user/userRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
applyMiddleware(app);

// ─── STATIC FILE SERVING (for product images) ─────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//inventry routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory/sales', inventorySalesRoutes);
app.use('/api/inventory/transfers', transferRoutes);
app.use('/api/inventory/reports', reportRoutes);

//Sales routes
app.use('/api/sales', productSalesRoutes);
app.use('/api/banks', bankRoutes);



//Customer routes
app.use('/api/customer', customerRoutes);

// HR routes
app.use('/api/hr', hrRoutes);

//Finance routes
app.use('/api/accounting/sales', accountingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/credit-payments', creditPaymentRoutes);
app.use('/api/accounts', chartOfAccountsRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/fiscal-periods', fiscalPeriodRoutes);
app.use('/api/finance/dashboard', financeDashboardRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);


//Supplier routes



//user authentication routes
app.use('/api/users', userRoutes);

//sales management routes

app.use('/api/sales-management', salesManagementRoutes);

const PORT = process.env.PORT || 5000;

databaseCon.authenticate()
    .then(() => {
        console.log('✅ Database connected with Sequelize');
        app.listen(PORT, () => {
            console.log(`Backend running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });