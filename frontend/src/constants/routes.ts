/**
 * LedgerPro — Frontend Route Paths
 * Used by React Router for navigation.
 */

export const FRONTEND_ROUTES = {
    // Root fallback (smart-redirect handler)
    ROOT: '/',

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
    WORKER_DASHBOARD: '/worker',

    // Inventory
    INVENTORY: '/inventory',
    INVENTORY_ADD: '/inventory/add',
    INVENTORY_EDIT: '/inventory/edit/:productId',
    INVENTORY_EXPIRY: '/inventory/expiry',
    STOCK_ADJUSTMENTS: '/inventory/adjustments',
    STOCK_ADJUSTMENT_NEW: '/inventory/adjustments/new',
    RETURNS: '/inventory/returns',
    RETURN_NEW: '/inventory/returns/new',

    // Brand sales analytics (admin + manager) — leaderboard + per-brand drill-down
    BRAND_ANALYTICS: '/analytics/brands',

    // Purchases (suppliers + goods receipts)
    PURCHASES: '/purchases',

    // Categories (managed product categories + per-category sales analytics)
    ADMIN_CATEGORIES: '/admin/categories',
    MANAGER_CATEGORIES: '/manager/categories',

    // POS & Sales
    POS: '/pos',
    SALES: '/sales',
    TRANSACTIONS: '/transactions',

    // Accounting — unified hub (Ledger / Receivables / Reports / Expenses / P&L tabs)
    ACCOUNTING: '/accounting',
    LEDGER: '/accounting/ledger',
    RECEIVABLES: '/accounting/receivables',
    FINANCIAL_REPORTS: '/accounting/reports',
    EXPENSES: '/accounting/expenses',
    PROFIT_LOSS: '/accounting/profit-loss',

    // Customer store credit ("khata") — walk-in buy-now-pay-later accounts
    CREDIT_ACCOUNTS: '/credit-accounts',

    // Cashier-facing store credit — counter lookup + repayments (scoped slice
    // of the admin/manager CREDIT_ACCOUNTS hub)
    STORE_CREDIT: '/store-credit',

    // Cashier-facing loyalty — branch member list + points history + enrol
    CASHIER_LOYALTY: '/loyalty-members',

    // Users
    USER_MANAGEMENT: '/users',
    CUSTOMERS: '/customers',
    CUSTOMER_INSIGHTS: '/customers/insights',
    CUSTOMER_DETAIL: '/customers/:key',
    PROFILE: '/profile',

    // Branches
    BRANCHES: '/branches',
    BRANCH_MANAGEMENT: '/branches/manage',

    // Admin-only Branches CRUD
    BRANCHES_HUB: '/admin/branches',

    // Admin-only side-by-side branch comparison
    BRANCH_COMPARE: '/admin/compare',

    // Admin-only loyalty program management
    ADMIN_LOYALTY: '/admin/loyalty',
    
    // Manager loyalty program management
    MANAGER_LOYALTY: '/manager/loyalty',

    // Admin / manager — unified HR workspace (Employees / Attendance / Leaves / Payroll tabs)
    ADMIN_HR: '/admin/hr',
    ADMIN_AUDIT: '/admin/audit',

    // Admin / manager — customer review moderation
    ADMIN_REVIEWS: '/admin/reviews',

    // Admin / manager — automatic POS discount schemes
    ADMIN_SCHEMES: '/admin/schemes',

    // Admin / manager — unified reports hub (salesman report + launcher)
    REPORTS: '/reports',

    // Admin / manager — HR employee management
    ADMIN_EMPLOYEES: '/admin/employees',
    ADMIN_EMPLOYEE_NEW: '/admin/employees/new',
    ADMIN_EMPLOYEE_EDIT: '/admin/employees/:id',

    // Admin / manager — HR attendance grid
    ADMIN_ATTENDANCE: '/admin/attendance',

    // Admin / manager / cashier — HR leaves
    ADMIN_LEAVES: '/admin/leaves',

    // Admin / manager — HR payroll
    ADMIN_PAYROLL: '/admin/payroll',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_DETAIL: '/notifications/:id',

    // Stock Transfers
    TRANSFERS: '/transfers',
    TRANSFERS_NEW: '/transfers/new',
    TRANSFER_HISTORY: '/transfers/history',
    TRANSFER_DETAIL: '/transfers/:id',
    ADMIN_TRANSFERS: '/admin/transfers',
    ADMIN_TRANSFER_NEW: '/admin/transfers/new',

    // Shipments (courier delivery tracking)
    SHIPMENTS: '/shipments',
    SHIPMENT_NEW: '/shipments/new',
    SHIPMENT_DETAIL: '/shipments/:id',

    // Customer storefront (login required)
    SHOP: '/shop',
    SHOP_PRODUCT_DETAIL: '/shop/products/:id',
    SHOP_CART: '/shop/cart',
    SHOP_CHECKOUT: '/shop/checkout',
    SHOP_CHECKOUT_PAY: '/shop/checkout/pay',
    SHOP_ORDER_GROUP: '/shop/orders/group/:code',
    SHOP_ORDER_CONFIRMATION: '/shop/orders/:code',
    SHOP_ORDER_CONFIRMATION_LEGACY: '/shop/requests/:code',
    SHOP_MY_ORDERS: '/shop/my-orders',
    SHOP_MY_ORDERS_LEGACY: '/shop/my-requests',
    SHOP_PROFILE: '/shop/profile',
    SHOP_REWARDS: '/shop/rewards',
    SHOP_GROUPS: '/shop/groups',
    SHOP_GROUP_DETAIL: '/shop/groups/:id',
    SHOP_GROUP_ANALYTICS: '/shop/groups/:id/analytics',

    // Cashier scan + shared customer orders view
    SCAN_ORDER: '/pos/scan-order',
    SCAN_ORDER_LEGACY: '/pos/scan-request',
    CUSTOMER_ORDERS: '/customer-orders',
} as const;

export type FrontendRoute = (typeof FRONTEND_ROUTES)[keyof typeof FRONTEND_ROUTES];
