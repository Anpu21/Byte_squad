/**
 * LedgerPro — Frontend Route Paths
 * Used ONLY by React Router. Never import this in backend code.
 */

export const FRONTEND_ROUTES = {
    // Auth
    LOGIN: '/login',
    OTP_VERIFICATION: '/verify-otp',

    // Dashboard
    DASHBOARD: '/dashboard',

    // Inventory
    INVENTORY: '/inventory',
    INVENTORY_ADD: '/inventory/add',
    INVENTORY_EDIT: '/inventory/edit/:productId',

    // POS
    POS: '/pos',

    // Accounting
    LEDGER: '/accounting/ledger',
    EXPENSES: '/accounting/expenses',

    // Users
    USER_MANAGEMENT: '/users',
    PROFILE: '/profile',

    // Branches
    BRANCHES: '/branches',

    // Notifications
    NOTIFICATIONS: '/notifications',
} as const;

export type FrontendRoute = (typeof FRONTEND_ROUTES)[keyof typeof FRONTEND_ROUTES];
