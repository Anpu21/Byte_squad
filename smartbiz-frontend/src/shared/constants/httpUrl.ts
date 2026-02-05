/**
 * Central HTTP URL Object
 * All API endpoints must be defined here - NO hardcoded strings anywhere else!
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const HttpUrl = {
    // Authentication
    AUTH: {
        LOGIN: `${API_BASE}/auth/login`,
        LOGOUT: `${API_BASE}/auth/logout`,
        REFRESH: `${API_BASE}/auth/refresh`,
    },

    // Users
    USERS: {
        LIST: `${API_BASE}/users`,
        CREATE: `${API_BASE}/users`,
        GET: (id: string) => `${API_BASE}/users/${id}`,
        UPDATE: (id: string) => `${API_BASE}/users/${id}`,
        DELETE: (id: string) => `${API_BASE}/users/${id}`,
    },

    // Companies
    COMPANIES: {
        LIST: `${API_BASE}/companies`,
        CREATE: `${API_BASE}/companies`,
        GET: (id: string) => `${API_BASE}/companies/${id}`,
        UPDATE: (id: string) => `${API_BASE}/companies/${id}`,
    },

    // Ledgers
    LEDGERS: {
        LIST: `${API_BASE}/ledgers`,
        CREATE: `${API_BASE}/ledgers`,
        GET: (id: string) => `${API_BASE}/ledgers/${id}`,
        UPDATE: (id: string) => `${API_BASE}/ledgers/${id}`,
        DELETE: (id: string) => `${API_BASE}/ledgers/${id}`,
        GROUPS: `${API_BASE}/ledgers/groups`,
    },

    // Vouchers
    VOUCHERS: {
        LIST: `${API_BASE}/vouchers`,
        CREATE: `${API_BASE}/vouchers`,
        GET: (id: string) => `${API_BASE}/vouchers/${id}`,
        POST: (id: string) => `${API_BASE}/vouchers/${id}/post`,
        VOID: (id: string) => `${API_BASE}/vouchers/${id}/void`,
    },

    // Inventory
    ITEMS: {
        LIST: `${API_BASE}/items`,
        CREATE: `${API_BASE}/items`,
        GET: (id: string) => `${API_BASE}/items/${id}`,
        UPDATE: (id: string) => `${API_BASE}/items/${id}`,
        DELETE: (id: string) => `${API_BASE}/items/${id}`,
        BY_BARCODE: (barcode: string) => `${API_BASE}/items/barcode/${barcode}`,
        CATEGORIES: `${API_BASE}/items/categories`,
        STOCK_MOVEMENTS: (id: string) => `${API_BASE}/items/${id}/movements`,
    },

    // Payments
    PAYMENTS: {
        LIST: `${API_BASE}/payments`,
        CREATE: `${API_BASE}/payments`,
        GET: (id: string) => `${API_BASE}/payments/${id}`,
        OUTSTANDING: `${API_BASE}/payments/outstanding`,
    },

    // Reports
    REPORTS: {
        TRIAL_BALANCE: `${API_BASE}/reports/trial-balance`,
        PROFIT_LOSS: `${API_BASE}/reports/profit-loss`,
        BALANCE_SHEET: `${API_BASE}/reports/balance-sheet`,
        DAY_BOOK: `${API_BASE}/reports/day-book`,
        STOCK_SUMMARY: `${API_BASE}/reports/stock-summary`,
        OUTSTANDING: `${API_BASE}/reports/outstanding`,
    },

    // Backup
    BACKUP: {
        CREATE: `${API_BASE}/backup/create`,
        RESTORE: (id: string) => `${API_BASE}/backup/restore/${id}`,
        HISTORY: `${API_BASE}/backup/history`,
    },
} as const;

export default HttpUrl;
