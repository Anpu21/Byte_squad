/**
 * LedgerPro — Backend API Route Paths
 */

const API_PREFIX = 'api/v1';

export const APP_ROUTES = {
  // Auth
  AUTH: {
    BASE: `${API_PREFIX}/auth`,
    LOGIN: 'login',
    SIGNUP: 'signup',
    VERIFY_OTP: 'verify-otp',
    RESEND_OTP: 'resend-otp',
    CHANGE_PASSWORD: 'change-password',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
    REFRESH: 'refresh',
  },

  // Users
  USERS: {
    BASE: `${API_PREFIX}/users`,
    PROFILE: 'profile',
    PROFILE_AVATAR: 'profile/avatar',
    MY_BRANCH: 'me/branch',
    BY_ID: ':id',
    RESEND_CREDENTIALS: ':id/resend-credentials',
    RESET_PASSWORD: ':id/reset-password',
  },

  // Branches
  BRANCHES: {
    BASE: `${API_PREFIX}/branches`,
    BY_ID: ':id',
    TOGGLE_ACTIVE: ':id/toggle-active',
    MY_PERFORMANCE: 'my-performance',
    CONFIRM_ACTION: 'actions/:actionId/confirm',
    RESEND_ACTION_OTP: 'actions/:actionId/resend',
  },

  // Products
  PRODUCTS: {
    BASE: `${API_PREFIX}/products`,
    CATEGORIES: 'categories',
    BY_ID: ':id',
    BY_BARCODE: 'barcode/:barcode',
    IMAGE: ':id/image',
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
    MY_DASHBOARD: 'my-dashboard',
    MY_TRANSACTIONS: 'my-transactions',
    ALL_TRANSACTIONS: 'all-transactions',
    ADMIN_DASHBOARD: 'admin-dashboard',
  },

  // Accounting
  ACCOUNTING: {
    BASE: `${API_PREFIX}/accounting`,
    LEDGER: 'ledger',
    LEDGER_SUMMARY: 'ledger/summary',
    EXPENSES: 'expenses',
    EXPENSE_BY_ID: 'expenses/:id',
    EXPENSE_REVIEW: 'expenses/:id/review',
    PROFIT_LOSS: 'profit-loss',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: `${API_PREFIX}/notifications`,
    BY_ID: ':id',
    MARK_READ: ':id/read',
    MARK_ALL_READ: 'read-all',
  },

  // Admin Portal (system-wide endpoints — admin role only)
  ADMIN_PORTAL: {
    BASE: `${API_PREFIX}/admin`,
    OVERVIEW: 'overview',
    BRANCHES: 'branches',
    ADMINS: 'admins',
    COMPARISON: 'comparison',
    USERS: 'users',
    INVENTORY_MATRIX: 'inventory/matrix',
  },

  // Storefront catalog (CUSTOMER role only)
  SHOP: {
    BASE: `${API_PREFIX}/shop`,
    PRODUCTS: 'products',
    RECOMMENDED_PRODUCTS: 'recommended',
    PRODUCT_BY_ID: 'products/:id',
    CATEGORIES: 'products/categories',
    BRANCHES: 'branches',
  },

  // Customer pickup orders (cart -> order -> QR -> fulfill at counter)
  CUSTOMER_ORDERS: {
    BASE: `${API_PREFIX}/customer-orders`,
    MINE: 'mine',
    BY_CODE: 'code/:code',
    BY_ID: ':id',
    CANCEL: ':id/cancel',
    ACCEPT: ':id/accept',
    REJECT: ':id/reject',
    FULFILL: 'code/:code/fulfill',
    PAYHERE_NOTIFY: 'payhere/notify',
  },

  // Customer loyalty
  LOYALTY: {
    BASE: `${API_PREFIX}/loyalty`,
    MINE: 'me',
    HISTORY: 'me/history',
  },

  // Stock Transfers (inter-branch stock movement)
  STOCK_TRANSFERS: {
    BASE: `${API_PREFIX}/stock-transfers`,
    MY_REQUESTS: 'my-requests',
    INCOMING: 'incoming',
    HISTORY: 'history',
    BY_ID: ':id',
    SOURCE_OPTIONS: ':id/source-options',
    APPROVE: ':id/approve',
    REJECT: ':id/reject',
    CANCEL: ':id/cancel',
    SHIP: ':id/ship',
    RECEIVE: ':id/receive',
  },
} as const;

export type APP_ROUTES_TYPE = keyof typeof APP_ROUTES;
