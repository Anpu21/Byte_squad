/**
 * Central Route Constants
 * All routes must be defined here - NO hardcoded route strings anywhere else!
 */

export const ROUTES = {
    // Auth
    AUTH: {
        LOGIN: '/login',
        LOGOUT: '/logout',
        FORGOT_PASSWORD: '/forgot-password',
    },

    // Admin/Dashboard
    ADMIN: {
        DASHBOARD: '/admin/dashboard',
    },

    // Users
    USERS: {
        LIST: '/users',
        CREATE: '/users/new',
        EDIT: (id: string) => `/users/${id}/edit`,
        VIEW: (id: string) => `/users/${id}`,
    },

    // Accounting
    ACCOUNTING: {
        LEDGERS: '/accounting/ledgers',
        LEDGER_CREATE: '/accounting/ledgers/new',
        LEDGER_VIEW: (id: string) => `/accounting/ledgers/${id}`,

        VOUCHERS: '/accounting/vouchers',
        VOUCHER_CREATE: '/accounting/vouchers/new',
        VOUCHER_VIEW: (id: string) => `/accounting/vouchers/${id}`,

        JOURNAL: '/accounting/journal',
        DAY_BOOK: '/accounting/day-book',
    },

    // Billing
    BILLING: {
        SALES: '/billing/sales',
        SALES_CREATE: '/billing/sales/new',
        SALES_VIEW: (id: string) => `/billing/sales/${id}`,

        PURCHASE: '/billing/purchase',
        PURCHASE_CREATE: '/billing/purchase/new',

        POS: '/billing/pos',
    },

    // Inventory
    INVENTORY: {
        ITEMS: '/inventory/items',
        ITEM_CREATE: '/inventory/items/new',
        ITEM_VIEW: (id: string) => `/inventory/items/${id}`,

        CATEGORIES: '/inventory/categories',
        STOCK: '/inventory/stock',
        STOCK_ADJUSTMENT: '/inventory/stock/adjust',
    },

    // Payments
    PAYMENTS: {
        LIST: '/payments',
        RECEIVE: '/payments/receive',
        MAKE: '/payments/make',
        OUTSTANDING: '/payments/outstanding',
    },

    // Reports
    REPORTS: {
        TRIAL_BALANCE: '/reports/trial-balance',
        PROFIT_LOSS: '/reports/profit-loss',
        BALANCE_SHEET: '/reports/balance-sheet',
        DAY_BOOK: '/reports/day-book',
        STOCK_SUMMARY: '/reports/stock-summary',
        OUTSTANDING: '/reports/outstanding',
    },

    // Settings
    SETTINGS: {
        COMPANY: '/settings/company',
        BACKUP: '/settings/backup',
        USERS: '/settings/users',
    },
} as const;

export default ROUTES;
