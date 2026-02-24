/**
 * LedgerPro — Backend API Route Paths
 * Used ONLY by NestJS controllers. Never import this in frontend code.
 */

const API_PREFIX = 'api/v1';

export const BACKEND_ROUTES = {
    // Auth
    AUTH: {
        BASE: `${API_PREFIX}/auth`,
        LOGIN: 'login',
        VERIFY_OTP: 'verify-otp',
        CHANGE_PASSWORD: 'change-password',
        REFRESH: 'refresh',
    },

    // Users
    USERS: {
        BASE: `${API_PREFIX}/users`,
        PROFILE: 'profile',
        BY_ID: ':id',
    },

    // Branches
    BRANCHES: {
        BASE: `${API_PREFIX}/branches`,
        BY_ID: ':id',
    },

    // Products
    PRODUCTS: {
        BASE: `${API_PREFIX}/products`,
        BY_ID: ':id',
        BY_BARCODE: 'barcode/:barcode',
    },

    // Inventory
    INVENTORY: {
        BASE: `${API_PREFIX}/inventory`,
        BY_BRANCH: 'branch/:branchId',
        LOW_STOCK: 'low-stock',
        UPDATE_STOCK: ':id/stock',
    },

    // POS / Transactions
    POS: {
        BASE: `${API_PREFIX}/pos`,
        TRANSACTIONS: 'transactions',
        TRANSACTION_BY_ID: 'transactions/:id',
        DAILY_REPORT: 'daily-report',
    },

    // Accounting
    ACCOUNTING: {
        BASE: `${API_PREFIX}/accounting`,
        LEDGER: 'ledger',
        EXPENSES: 'expenses',
        EXPENSE_BY_ID: 'expenses/:id',
        PROFIT_LOSS: 'profit-loss',
    },

    // Notifications
    NOTIFICATIONS: {
        BASE: `${API_PREFIX}/notifications`,
        MARK_READ: ':id/read',
        MARK_ALL_READ: 'read-all',
    },
} as const;

export type BackendRouteGroup = keyof typeof BACKEND_ROUTES;
