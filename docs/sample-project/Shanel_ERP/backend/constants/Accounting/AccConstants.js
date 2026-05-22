
const ACCOUNTS = {
    // ASSETS
    CASH_IN_HAND: '1001',              // Account_Code: 1001
    BANK_ACCOUNT_BOC: '1002',          // Account_Code: 1002
    ACCOUNTS_RECEIVABLE: '1003',       // Account_Code: 1003
    INVENTORY: '1004',                 // Account_Code: 1004
    CHEQUES_IN_HAND: '1005',           // Account_Code: 1005
    
    // LIABILITIES
    ACCOUNTS_PAYABLE: '2001',          // Account_Code: 2001
    
    // EQUITY
    OWNER_CAPITAL: '3001',             // Account_Code: 3001
    RETAINED_EARNINGS: '3002',         // Account_Code: 3002 (if exists)
    
    // REVENUE
    SALES_REVENUE_RETAIL: '4001',      // Account_Code: 4001
    SALES_REVENUE_WHOLESALE: '4002',   // Account_Code: 4002
    OTHER_INCOME: '4003',              // Account_Code: 4003 (if exists)
    
    // EXPENSES
    COGS: '5001',                      // Account_Code: 5001
    SALARY_EXPENSE: '5002',            // Account_Code: 5002
    DISCOUNT_GIVEN: '5003',            // Account_Code: 5003
    RENT_EXPENSE: '5004',              // Account_Code: 5004
    UTILITIES_EXPENSE: '5005',         // Account_Code: 5005
    RAW_MATERIALS_EXPENSE: '5006',     // Account_Code: 5006
    TRANSPORT_EXPENSE: '5007',         // Account_Code: 5007
    MAINTENANCE_EXPENSE: '5008',       // Account_Code: 5008
    MARKETING_EXPENSE: '5009',         // Account_Code: 5009
    OFFICE_SUPPLIES_EXPENSE: '5010',   // Account_Code: 5010
    OTHER_EXPENSE: '5011'              // Account_Code: 5011
};

// Maps expense categories to their account codes
const EXPENSE_CATEGORY_ACCOUNTS = {
    'Salary': ACCOUNTS.SALARY_EXPENSE,
    'Rent': ACCOUNTS.RENT_EXPENSE,
    'Utilities': ACCOUNTS.UTILITIES_EXPENSE,
    'Raw_Materials': ACCOUNTS.RAW_MATERIALS_EXPENSE,
    'Transport': ACCOUNTS.TRANSPORT_EXPENSE,
    'Maintenance': ACCOUNTS.MAINTENANCE_EXPENSE,
    'Marketing': ACCOUNTS.MARKETING_EXPENSE,
    'Office_Supplies': ACCOUNTS.OFFICE_SUPPLIES_EXPENSE,
    'Other': ACCOUNTS.OTHER_EXPENSE
};

// Maps income categories to their account codes
const INCOME_CATEGORY_ACCOUNTS = {
    Sales: ACCOUNTS.SALES_REVENUE_RETAIL,
    Interest: ACCOUNTS.OTHER_INCOME,
    Commission: ACCOUNTS.OTHER_INCOME,
    Other: ACCOUNTS.OTHER_INCOME
};

const PAYMENT_METHODS = {
    CASH: 'Cash',
    CREDIT: 'Credit',
    BANK: 'Bank',
    BANK_DEPOSIT: 'Bank_Deposit',
    CHEQUE: 'Cheque',
    CARD: 'Card'
};

module.exports = {
    ACCOUNTS,
    PAYMENT_METHODS,
    EXPENSE_CATEGORY_ACCOUNTS,
    INCOME_CATEGORY_ACCOUNTS
};