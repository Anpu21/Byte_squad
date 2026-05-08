/**
 * LedgerPro — Frontend Route Paths
 * Used by React Router for navigation.
 */

export const FRONTEND_ROUTES = {
    // Auth
    LOGIN: '/login',
    SIGNUP: '/signup',
    OTP_VERIFICATION: '/verify-otp',
    CHANGE_PASSWORD: '/change-password',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    SELECT_BRANCH: '/select-branch',

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

    // Admin-only Branches CRUD
    BRANCHES_HUB: '/admin/branches',

    // Admin-only side-by-side branch comparison
    BRANCH_COMPARE: '/admin/compare',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_DETAIL: '/notifications/:id',

    // Stock Transfers
    TRANSFERS: '/transfers',
    TRANSFERS_NEW: '/transfers/new',
    TRANSFER_HISTORY: '/transfers/history',
    TRANSFER_DETAIL: '/transfers/:id',
    ADMIN_TRANSFERS: '/admin/transfers',

    // Customer storefront (login required)
    SHOP: '/shop',
    SHOP_PRODUCT_DETAIL: '/shop/products/:id',
    SHOP_CART: '/shop/cart',
    SHOP_CHECKOUT: '/shop/checkout',
    SHOP_REQUEST_CONFIRMATION: '/shop/requests/:code',
    SHOP_MY_REQUESTS: '/shop/my-requests',

    // Cashier scan + shared customer requests view
    SCAN_REQUEST: '/pos/scan-request',
    CUSTOMER_REQUESTS: '/customer-requests',
} as const;

export type FrontendRoute = (typeof FRONTEND_ROUTES)[keyof typeof FRONTEND_ROUTES];
