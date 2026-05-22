const Sale = require('../sales/Sales');
const SaleItem = require('../sales/SalesItem');
const Payment = require('../sales/Payment');
const CreditTranscation = require('../customer/CreditTranscation');
const Customer = require('../customer/customer');
const SalesSummaryDaily = require('../sales/SalesSummaryDaily');
const User = require('../user/User');
const Product = require('../inventory/Product');
const UnitConversion = require('../inventory/UnitConversion');

// const Production = require('../production/Production');

module.exports = () =>{
    //Sale -> SaleItem
    Sale.hasMany(SaleItem,{foreignKey:'Sale_ID'});
    SaleItem.belongsTo(Sale,{foreignKey:'Sale_ID'});

    //Sale-> Payment
    Sale.hasMany(Payment,{foreignKey:'Sale_ID'});
    Payment.belongsTo(Sale,{foreignKey:'Sale_ID'});


    // Sale -> Credit Transaction (for credit taken)
    Sale.hasMany(CreditTranscation,{foreignKey:'Sale_ID'});
    CreditTranscation.belongsTo(Sale,{foreignKey:'Sale_ID'});

    //payment -> Credit Transaction (for credit paid)
    Payment.hasMany(CreditTranscation,{foreignKey:'Pay_ID'});
    CreditTranscation.belongsTo(Payment,{foreignKey:'Pay_ID'});

    //Sale -> Customer
    Customer.hasMany(Sale,{foreignKey: 'C_ID'});
    Sale.belongsTo(Customer,{foreignKey: 'C_ID'});

    // SaleItem → Product
    Product.hasMany(SaleItem, { foreignKey: 'P_ID' });
    SaleItem.belongsTo(Product, { foreignKey: 'P_ID' });

    // SaleItem → UnitConversion
    UnitConversion.hasMany(SaleItem, { foreignKey: 'U_ID' });
    SaleItem.belongsTo(UnitConversion, { foreignKey: 'U_ID' });

    // SaleItem → Production batch (uncomment when Production model is added)
    // Production.hasMany(SaleItem, { foreignKey: 'PR_ID' });
    // SaleItem.belongsTo(Production, { foreignKey: 'PR_ID' });

    // Sale → User (Cashier)
    User.hasMany(Sale, { foreignKey: 'Cashier_ID', as: 'CashierSales' });
    Sale.belongsTo(User, { foreignKey: 'Cashier_ID', as: 'Cashier' });

    // SalesSummaryDaily → User (cashier)
    User.hasMany(SalesSummaryDaily, { foreignKey: 'Cashier_ID', as: 'DailySummaries' });
    SalesSummaryDaily.belongsTo(User, { foreignKey: 'Cashier_ID', as: 'SummaryCashier' });

    // ProductReturn is handled by the Inventory module
    // See models/inventory/ProductReturn.js
}