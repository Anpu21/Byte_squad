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

    // Accounting
    LEDGER: '/accounting/ledger',
    EXPENSES: '/accounting/expenses',
    PROFIT_LOSS: '/accounting/profit-loss',

    // Users
    USER_MANAGEMENT: '/users',
    PROFILE: '/profile',

    // Branches
    BRANCHES: '/branches',

    // Super Admin
    SUPER_ADMIN_DASHBOARD: '/super-admin/dashboard',
    BRANCH_MANAGEMENT: '/super-admin/branches',
    ADMIN_MANAGEMENT: '/super-admin/admins',

    // Notifications
    NOTIFICATIONS: '/notifications',
} as const;

export type FrontendRoute = (typeof FRONTEND_ROUTES)[keyof typeof FRONTEND_ROUTES];
