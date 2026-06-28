/**
 * LedgerPro — Backend API Route Paths
 */

const API_PREFIX = 'api/v1';

export const APP_ROUTES = {
  // Health — infra endpoints, intentionally NOT under API_PREFIX so
  // orchestrators / load balancers hit a stable path.
  HEALTH: {
    BASE: 'health',
    LIVE: '',
    READY: 'ready',
  },

  // Well-known — public JWKS for RS256 access-token verification by other
  // services (e.g. the chatbot). Outside API_PREFIX so it sits at the
  // conventional /.well-known/ path that JWKS clients expect.
  WELL_KNOWN: {
    JWKS: '.well-known/jwks.json',
  },

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
    LOGOUT: 'logout',
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
  },

  // Products
  PRODUCTS: {
    BASE: `${API_PREFIX}/products`,
    CATEGORIES: 'categories',
    BRANDS: 'brands',
    BY_ID: ':id',
    BY_BARCODE: 'barcode/:barcode',
    IMAGE: ':id/image',
  },

  // Managed product categories (CRUD + per-category sales analytics)
  CATEGORIES: {
    BASE: `${API_PREFIX}/categories`,
    ANALYTICS: 'analytics',
    BY_ID: ':id',
    ARCHIVE: ':id/archive',
  },

  // Managed product brands (CRUD + brand sales analytics: leaderboard +
  // per-brand product drill-down). Analytics routes are declared before BY_ID
  // in the controller so `analytics/...` isn't captured by the `:id` param.
  BRANDS: {
    BASE: `${API_PREFIX}/brands`,
    ANALYTICS_OVERVIEW: 'analytics/overview',
    ANALYTICS_BRAND: 'analytics/:brandId',
    BY_ID: ':id',
    ARCHIVE: ':id/archive',
  },

  // Customer store-credit accounts (khata / loan-book): enrollment request →
  // manager approval (limit + term) → buy-on-credit at POS → repayments.
  // `search` / `authorize-override` are declared before `:id` in the controller
  // so the literal paths aren't captured by the `:id` param route.
  CREDIT_ACCOUNTS: {
    BASE: `${API_PREFIX}/credit-accounts`,
    SEARCH: 'search',
    AUTHORIZE_OVERRIDE: 'authorize-override',
    BY_ID: ':id',
    APPROVE: ':id/approve',
    REJECT: ':id/reject',
    SUSPEND: ':id/suspend',
    CLOSE: ':id/close',
    STATEMENT: ':id/statement',
    PAYMENTS: ':id/payments',
  },

  // Inventory
  INVENTORY: {
    BASE: `${API_PREFIX}/inventory`,
    BY_BRANCH: 'branch/:branchId',
    LOW_STOCK: 'low-stock',
    UPDATE_STOCK: ':id/stock',
    // Phase C1 — batch/expiry tracking (goods receipt with expiry date,
    // expiry report, on-demand expiry alert scan).
    BATCHES: 'batches',
    EXPIRY_REPORT: 'expiry/report',
    EXPIRY_ALERTS_SCAN: 'expiry/scan',
  },

  // Stock Adjustments (Phase C2 — reason-coded corrections w/ reverse)
  STOCK_ADJUSTMENTS: {
    BASE: `${API_PREFIX}/stock-adjustments`,
    BY_ID: ':id',
    APPROVE: ':id/approve',
    REVERSE: ':id/reverse',
  },

  // Sales Returns (Phase C3 — invoice lookup, good/bad split, restock)
  RETURNS: {
    BASE: `${API_PREFIX}/returns`,
    LOOKUP: 'lookup',
    BY_ID: ':id',
  },

  // POS / Transactions
  POS: {
    BASE: `${API_PREFIX}/pos`,
    // Legacy / Phase 0..3 surface — Phase 5 will deprecate. Kept so callers
    // built against the dashboard endpoints continue to compile during the
    // Shanel-port migration.
    TRANSACTIONS: 'transactions',
    TRANSACTION_BY_ID: 'transactions/:id',
    TRANSACTION_PRINT: 'transactions/:id/print',
    DAILY_REPORT: 'daily-report',
    MY_DASHBOARD: 'my-dashboard',
    MY_TRANSACTIONS: 'my-transactions',
    ALL_TRANSACTIONS: 'all-transactions',
    ADMIN_DASHBOARD: 'admin-dashboard',
    // Phase 4 — Shanel-aligned read endpoints (search, units, inventory,
    // recent sales, invoice-number preview).
    SEARCH_PRODUCTS: 'products/search',
    PRODUCT_UNITS: 'products/:productId/units',
    BASE_UNIT_QTY: 'products/:productId/units/:unitName/base-qty',
    PRODUCT_INVENTORY: 'products/:productId/inventory',
    RECENT_SALES: 'recent-sales',
    GENERATE_INVOICE_NO: 'invoice-number',
    // Phase 9 — Shanel-aligned customer search for the POS customer picker.
    SEARCH_CUSTOMERS: 'customers/search',
    // Phase 5+ placeholders — declared now so subsequent phases don't have
    // to touch this file when wiring the Shanel-shaped sale write/print/void
    // mutations.
    SALES: 'sales',
    SALE_BY_ID: 'sales/:id',
    SALE_PRINT: 'sales/:id/print',
    SALE_EMAIL_RECEIPT: 'sales/:id/email-receipt',
    SALE_VOID: 'sales/:id/void',
    // Phase 2 — customer receivables (AR mirror of supplier payables).
    RECEIVABLES: 'receivables',
    RECEIVABLES_STATEMENT: 'receivables/:userId/statement',
    RECEIVABLES_PAYMENTS: 'receivables/:userId/payments',
    RECEIVABLES_CREDIT_LIMIT: 'receivables/:userId/credit-limit',
    // Phase 2 — drawer sessions + day-end Z-report.
    SHIFTS: 'shifts',
    SHIFTS_CURRENT: 'shifts/current',
    SHIFTS_OPEN: 'shifts/open',
    SHIFTS_CLOSE: 'shifts/close',
    SHIFTS_MOVEMENTS: 'shifts/movements',
    // Floor ops — server-persisted held / suspended sales.
    HELD_SALES: 'held-sales',
    HELD_SALE_BY_ID: 'held-sales/:id',
    // Phase 4 — automatic discount schemes (date-window / qty-slab rules).
    SCHEMES: 'schemes',
    SCHEMES_ACTIVE: 'schemes/active',
    SCHEME_BY_ID: 'schemes/:id',
    // Phase 4 — cashier-wise sales report.
    REPORTS_SALESMAN: 'reports/salesman',
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
    // Phase 3 — chart of accounts.
    ACCOUNTS: 'accounts',
    JOURNALS: 'journals',
    TRIAL_BALANCE: 'reports/trial-balance',
    BALANCE_SHEET: 'reports/balance-sheet',
    DAY_BOOK: 'reports/day-book',
    PERIODS: 'periods',
    PERIODS_LOCK: 'periods/lock',
    PERIODS_UNLOCK: 'periods/unlock',
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

  // Branch analytics (admin + manager aggregate comparison)
  BRANCH_ANALYTICS: {
    BASE: `${API_PREFIX}/branch-analytics`,
    COMPARISON: 'comparison',
    BRANCHES: 'branches',
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

  // Product reviews & ratings — customer storefront surface (under shop/) +
  // staff moderation (under admin/reviews).
  REVIEWS: {
    BASE: `${API_PREFIX}/shop`,
    PRODUCT_REVIEWS: 'products/:productId/reviews',
    REVIEW_BY_ID: 'reviews/:id',
    ADMIN_BASE: `${API_PREFIX}/admin/reviews`,
    ADMIN_REVIEW_BY_ID: ':id',
    ADMIN_REVIEW_HIDE: ':id/hide',
    ADMIN_REVIEW_UNHIDE: ':id/unhide',
  },

  // Customer pickup orders (cart -> order -> QR -> fulfill at counter)
  CUSTOMER_ORDERS: {
    BASE: `${API_PREFIX}/customer-orders`,
    CHECKOUT: 'checkout',
    MINE: 'mine',
    GROUP_BY_CODE: 'group/:code',
    BY_CODE: 'code/:code',
    BY_ID: ':id',
    CANCEL: ':id/cancel',
    NOT_COLLECTED: ':id/not-collected',
    FULFILL: 'code/:code/fulfill',
    PAYHERE_NOTIFY: 'payhere/notify',
  },

  // Customer shopping groups ("shop together"): groups + shared cart + group
  // purchase analytics. Static segments (mine/join) are declared before BY_ID in
  // the controller so they aren't captured by the `:id` param.
  CUSTOMER_GROUPS: {
    BASE: `${API_PREFIX}/customer-groups`,
    MINE: 'mine',
    JOIN: 'join',
    BY_ID: ':id',
    REGENERATE_CODE: ':id/regenerate-code',
    LEAVE: ':id/leave',
    MEMBER: ':id/members/:userId',
    CART: ':id/cart',
    CART_ITEM: ':id/cart/:itemId',
    CHECKOUT: ':id/checkout',
    ANALYTICS: ':id/analytics',
  },

  // Customer loyalty
  LOYALTY: {
    BASE: `${API_PREFIX}/loyalty`,
    MINE: 'me',
    HISTORY: 'me/history',
    SETTINGS: 'settings',
    LOOKUP: 'lookup',
    ENROLL: 'enroll',
    ADMIN_BASE: `${API_PREFIX}/admin/loyalty`,
    ADMIN_SETTINGS: 'settings',
    ADMIN_CUSTOMERS: 'customers',
    ADMIN_CUSTOMER_HISTORY: 'customers/:userId/history',
    ADMIN_DASHBOARD: 'dashboard',
    ADMIN_ADJUST: 'customers/:userId/adjust',
    MANAGER_BASE: `${API_PREFIX}/manager/loyalty`,
    MANAGER_CUSTOMERS: 'customers',
    MANAGER_CUSTOMER_HISTORY: 'customers/:userId/history',
    MANAGER_DASHBOARD: 'dashboard',
  },

  // HR — employees, attendance, payroll
  HR: {
    BASE: `${API_PREFIX}/hr`,
    EMPLOYEES: {
      BASE: `${API_PREFIX}/hr/employees`,
      BY_ID: ':id',
      TERMINATE: ':id/terminate',
      PHOTO: ':id/photo',
    },
    ATTENDANCE: {
      BASE: `${API_PREFIX}/hr/attendance`,
      BULK: 'bulk',
      CHECK_IN: 'check-in',
      CHECK_OUT: 'check-out',
      ME: 'me',
      TODAY_STATUS: 'today-status',
    },
    LEAVES: {
      BASE: `${API_PREFIX}/hr/leaves`,
      BY_ID: ':id',
      APPROVE: ':id/approve',
      REJECT: ':id/reject',
      CANCEL: ':id/cancel',
    },
    SALARY_STRUCTURES: {
      BASE: `${API_PREFIX}/hr/salary-structures`,
      BY_ID: ':id',
      DEACTIVATE: ':id/deactivate',
    },
    PAYROLL_SETTINGS: {
      BASE: `${API_PREFIX}/hr/payroll-settings`,
      GLOBAL: 'global',
      EFFECTIVE: 'effective',
      BRANCH: 'branch',
    },
    PAYROLL: {
      BASE: `${API_PREFIX}/hr/payroll`,
      BY_ID: ':id',
      GENERATE: 'generate',
      APPROVE: ':id/approve',
      MARK_PAID: ':id/mark-paid',
      CANCEL: ':id/cancel',
      CSV: 'csv',
    },
  },

  // Stock Transfers (inter-branch stock movement)
  STOCK_TRANSFERS: {
    BASE: `${API_PREFIX}/stock-transfers`,
    MY_REQUESTS: 'my-requests',
    INCOMING: 'incoming',
    HISTORY: 'history',
    ANALYTICS: 'analytics',
    ADMIN_DIRECT: 'admin-direct',
    MANAGER_BATCH: 'manager-batch',
    BY_ID: ':id',
    SOURCE_OPTIONS: ':id/source-options',
    APPROVE: ':id/approve',
    REJECT: ':id/reject',
    CANCEL: ':id/cancel',
    SHIP: ':id/ship',
    RECEIVE: ':id/receive',
  },

  // Shipments (courier-driven delivery tracking over transfer lines)
  SHIPMENTS: {
    BASE: `${API_PREFIX}/shipments`,
    BY_ID: ':id',
    ASSIGN_COURIER: ':id/assign-courier',
    DISPATCH: ':id/dispatch',
    CHECKPOINT: ':id/checkpoint',
    OUT_FOR_DELIVERY: ':id/out-for-delivery',
    DELIVER: ':id/deliver',
    RETURN: ':id/return',
    CANCEL: ':id/cancel',
  },

  // Append-only activity log (global mutation interceptor)
  AUDIT: {
    BASE: `${API_PREFIX}/audit/logs`,
  },

  // Supplier master (the "party" registry behind purchases)
  SUPPLIERS: {
    BASE: `${API_PREFIX}/suppliers`,
    BY_ID: ':id',
  },

  // Purchases — BUSY-style procurement cycle (PO → GRN → bills → payments)
  PURCHASES: {
    BASE: `${API_PREFIX}/purchases`,
    ORDERS: {
      BASE: `${API_PREFIX}/purchases/orders`,
      BY_ID: ':id',
      SEND: ':id/send',
      CANCEL: ':id/cancel',
    },
    GRNS: {
      BASE: `${API_PREFIX}/purchases/grns`,
      BY_ID: ':id',
      VOID: ':id/void',
    },
    PAYMENTS: {
      BASE: `${API_PREFIX}/purchases/payments`,
      BY_ID: ':id',
    },
    RETURNS: {
      BASE: `${API_PREFIX}/purchases/returns`,
      BY_ID: ':id',
    },
    REPORTS: {
      BASE: `${API_PREFIX}/purchases/reports`,
      OUTSTANDING: 'outstanding',
      AGEING: 'ageing',
    },
    REORDER: {
      BASE: `${API_PREFIX}/purchases/reorder-suggestions`,
      DRAFT: 'draft',
    },
  },
} as const;

export type APP_ROUTES_TYPE = keyof typeof APP_ROUTES;
