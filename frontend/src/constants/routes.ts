/**
 * LedgerPro — Frontend Route Paths
 * Used by React Router for navigation.
 */

export const FRONTEND_ROUTES = {
    // Auth
    LOGIN: '/login',
    OTP_VERIFICATION: '/verify-otp',
    CHANGE_PASSWORD: '/change-password',

    // Dashboard
    DASHBOARD: '/dashboard',
    CASHIER_DASHBOARD: '/cashier-dashboard',

    // Inventory
    INVENTORY: '/inventory',
    INVENTORY_ADD: '/inventory/add',
    INVENTORY_EDIT: '/inventory/edit/:productId',

    // POS
    POS: '/pos',
    TRANSACTIONS: '/transactions',

    // Accounting
    LEDGER: '/accounting/ledger',
    EXPENSES: '/accounting/expenses',
    PROFIT_LOSS: '/accounting/profit-loss',

    // Users
    USER_MANAGEMENT: '/users',
    PROFILE: '/profile',

    // Branches
    BRANCHES: '/branches',
    BRANCH_MANAGEMENT: '/branches/manage',

    // Admin (system-wide views)
    OVERVIEW: '/overview',
    BRANCH_COMPARISON: '/comparison',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_DETAIL: '/notifications/:id',
} as const;

export type FrontendRoute = (typeof FRONTEND_ROUTES)[keyof typeof FRONTEND_ROUTES];
