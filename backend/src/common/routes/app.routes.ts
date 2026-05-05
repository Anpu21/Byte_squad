/**
 * LedgerPro — Backend API Route Paths
 */

const API_PREFIX = 'api/v1';

export const APP_ROUTES = {
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
    PROFILE_AVATAR: 'profile/avatar',
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
  },

  // Products
  PRODUCTS: {
    BASE: `${API_PREFIX}/products`,
    CATEGORIES: 'categories',
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
    MY_DASHBOARD: 'my-dashboard',
    MY_TRANSACTIONS: 'my-transactions',
    ADMIN_DASHBOARD: 'admin-dashboard',
  },

  // Accounting
  ACCOUNTING: {
    BASE: `${API_PREFIX}/accounting`,
    LEDGER: 'ledger',
    LEDGER_SUMMARY: 'ledger/summary',
    EXPENSES: 'expenses',
    EXPENSE_BY_ID: 'expenses/:id',
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
  },

  // Stock Transfers (inter-branch stock movement)
  STOCK_TRANSFERS: {
    BASE: `${API_PREFIX}/stock-transfers`,
    MY_REQUESTS: 'my-requests',
    INCOMING: 'incoming',
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
