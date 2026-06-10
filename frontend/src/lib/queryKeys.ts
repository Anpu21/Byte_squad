/**
 * Centralized TanStack Query key factory.
 *
 * Rules.md §6 mandates a single source of truth for query keys per feature.
 * Every cross-component query key in the app should live here.
 */

import type {
    IInventoryParams,
    IExpiryReportParams,
    IStockAdjustmentsParams,
    IReturnsParams,
    IListTransfersParams,
    IListTransferHistoryParams,
} from '@/types';

export interface AdminInventoryMatrixFilters {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    page: number;
    limit: number;
}

export interface ListEmployeesQueryKey {
    branchId?: string;
    search?: string;
    status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
    limit?: number;
    offset?: number;
}

export interface ListAttendanceQueryKey {
    branchId?: string;
    employeeId?: string;
    startDate: string;
    endDate: string;
}

export interface ListLeavesQueryKey {
    branchId?: string;
    employeeId?: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface ListPayrollQueryKey {
    branchId?: string;
    employeeId?: string;
    month?: number;
    year?: number;
    status?: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
    limit?: number;
    offset?: number;
}

export const queryKeys = {
    admin: {
        inventoryMatrix: (filters: AdminInventoryMatrixFilters) =>
            ['admin', 'inventory-matrix', filters] as const,
        overview: () => ['admin', 'overview'] as const,
        branches: () => ['admin', 'branches'] as const,
        comparison: (submitted: unknown) =>
            ['admin', 'comparison', submitted] as const,
        branchAnalyticsComparison: (submitted: unknown) =>
            ['admin', 'branch-analytics-comparison', submitted] as const,
        dashboard: () => ['admin', 'dashboard'] as const,
    },
    inventory: {
        all: () => ['inventory'] as const,
        categories: () => ['inventory', 'categories'] as const,
        byBranch: (branchId: string, params?: IInventoryParams) =>
            ['inventory', 'by-branch', branchId, params ?? {}] as const,
    },
    categories: {
        all: () => ['categories'] as const,
        list: (includeInactive: boolean) =>
            ['categories', 'list', includeInactive] as const,
        analytics: (params: unknown) =>
            ['categories', 'analytics', params] as const,
    },
    expiry: {
        report: (params?: IExpiryReportParams) =>
            ['expiry', 'report', params ?? {}] as const,
        batches: (productId: string) =>
            ['expiry', 'batches', productId] as const,
    },
    stockAdjustments: {
        list: (params?: IStockAdjustmentsParams) =>
            ['stock-adjustments', 'list', params ?? {}] as const,
        byId: (id: string) => ['stock-adjustments', 'by-id', id] as const,
    },
    returns: {
        lookup: (invoiceNumber: string) =>
            ['returns', 'lookup', invoiceNumber] as const,
        list: (params?: IReturnsParams) =>
            ['returns', 'list', params ?? {}] as const,
    },
    notifications: {
        list: () => ['notifications', 'list'] as const,
        byId: (id: string) => ['notifications', 'by-id', id] as const,
    },
    stockTransfers: {
        myRequests: (params?: IListTransfersParams) =>
            ['stock-transfers', 'my-requests', params ?? {}] as const,
        incoming: (params?: IListTransfersParams) =>
            ['stock-transfers', 'incoming', params ?? {}] as const,
        all: (params?: IListTransfersParams) =>
            ['stock-transfers', 'all', params ?? {}] as const,
        history: (params?: IListTransferHistoryParams) =>
            ['stock-transfers', 'history', params ?? {}] as const,
        byId: (id: string) => ['stock-transfers', 'by-id', id] as const,
        sourceOptions: (id: string) =>
            ['stock-transfers', 'source-options', id] as const,
        counts: () => ['stock-transfers', 'counts'] as const,
        analytics: (params: unknown) =>
            ['stock-transfers', 'analytics', params] as const,
    },
    branches: {
        all: () => ['branches'] as const,
    },
    shop: {
        branches: () => ['shop', 'branches'] as const,
        branchesWithStaff: () => ['shop', 'branches-with-staff'] as const,
        categories: () => ['shop', 'categories'] as const,
        products: (params: unknown) => ['shop', 'products', params] as const,
        recommended: (params: unknown) =>
            ['shop', 'recommended', params] as const,
        publicProduct: (id: string, branchId: string | null) =>
            ['shop', 'public-product', id, branchId] as const,
    },
    profile: {
        self: () => ['profile'] as const,
    },
    expenses: {
        all: () => ['expenses'] as const,
        list: (filters: { branchId: string | null; status: string | null }) =>
            ['expenses', filters] as const,
    },
    product: {
        all: () => ['product'] as const,
        byId: (id: string) => ['product', 'by-id', id] as const,
    },
    users: {
        all: () => ['users'] as const,
    },
    customerOrders: {
        all: () => ['customer-orders'] as const,
        list: (filters: { statusFilter: string; search: string }) =>
            ['customer-orders', filters] as const,
        my: () => ['my-customer-orders'] as const,
        byCode: (code: string) =>
            ['customer-order-by-code', code] as const,
    },
    loyalty: {
        mine: () => ['loyalty', 'mine'] as const,
        history: (params: { limit?: number; offset?: number }) =>
            ['loyalty', 'history', params] as const,
        settings: () => ['loyalty', 'settings'] as const,
        /**
         * Cashier-side phone lookup. Keyed on the normalised phone so
         * a successful enrol can invalidate the exact pending query and
         * transition the card from miss → hit without a manual refetch.
         */
        posLookup: (phone: string) =>
            ['loyalty', 'pos-lookup', phone] as const,
    },
    hr: {
        all: () => ['hr'] as const,
        employees: (params: ListEmployeesQueryKey) =>
            ['hr', 'employees', params] as const,
        employee: (id: string) => ['hr', 'employee', id] as const,
        attendance: (params: ListAttendanceQueryKey) =>
            ['hr', 'attendance', params] as const,
        myAttendance: (params: { startDate: string; endDate: string }) =>
            ['hr', 'attendance', 'me', params] as const,
        todayAttendance: () => ['hr', 'attendance', 'today'] as const,
        leaves: (params: ListLeavesQueryKey) => ['hr', 'leaves', params] as const,
        leave: (id: string) => ['hr', 'leave', id] as const,
        payroll: (params: ListPayrollQueryKey) => ['hr', 'payroll', params] as const,
        payrollOne: (id: string) => ['hr', 'payroll', id] as const,
    },
    purchases: {
        all: () => ['purchases'] as const,
        suppliers: (params: {
            search?: string;
            status?: string;
            limit?: number;
            offset?: number;
        }) => ['purchases', 'suppliers', params] as const,
        supplier: (id: string) => ['purchases', 'supplier', id] as const,
        grns: (params: {
            supplierId?: string;
            branchId?: string;
            status?: string;
            paymentStatus?: string;
            startDate?: string;
            endDate?: string;
            limit?: number;
            offset?: number;
        }) => ['purchases', 'grns', params] as const,
        grn: (id: string) => ['purchases', 'grn', id] as const,
        payments: (params: {
            supplierId?: string;
            limit?: number;
            offset?: number;
        }) => ['purchases', 'payments', params] as const,
        orders: (params: {
            supplierId?: string;
            status?: string;
            limit?: number;
            offset?: number;
        }) => ['purchases', 'orders', params] as const,
        outstanding: () => ['purchases', 'outstanding'] as const,
        ageing: () => ['purchases', 'ageing'] as const,
    },
    shipments: {
        all: () => ['shipments'] as const,
        list: (params: {
            status?: string
            branchId?: string
            page?: number
            limit?: number
        }) => ['shipments', 'list', params] as const,
        detail: (id: string) => ['shipments', 'detail', id] as const,
    },
    adminLoyalty: {
        customers: (params: {
            search?: string;
            branchId?: string;
            activeSince?: string;
            minPoints?: number;
            maxPoints?: number;
            limit?: number;
            offset?: number;
        }) => ['admin-loyalty', 'customers', params] as const,
        customerHistory: (
            userId: string,
            params: { limit?: number; offset?: number },
        ) => ['admin-loyalty', 'customer-history', userId, params] as const,
    },
    cashierDashboard: () => ['cashier-dashboard'] as const,
    transactions: {
        summary: (scope: string) =>
            ['transactions-summary', scope] as const,
    },
    branch: {
        myPerformance: () => ['my-branch-performance'] as const,
    },
    ledger: {
        entries: (filters: {
            entryType?: string;
            startDate?: string;
            endDate?: string;
            search?: string;
            page: number;
            limit: number;
        }) => ['ledger', 'entries', filters] as const,
        summary: () => ['ledger', 'summary'] as const,
    },
    accounting: {
        profitLoss: (startDate: string, endDate: string) =>
            ['accounting', 'profit-loss', startDate, endDate] as const,
    },
    pos: {
        all: () => ['pos'] as const,
        searchProducts: (q: string, limit: number) =>
            ['pos', 'searchProducts', q, limit] as const,
        productUnits: (productId: string) =>
            ['pos', 'productUnits', productId] as const,
        productInventory: (productId: string) =>
            ['pos', 'productInventory', productId] as const,
        productInventoryAll: () => ['pos', 'productInventory'] as const,
        recentSales: (limit: number) =>
            ['pos', 'recentSales', limit] as const,
        recentSalesAll: () => ['pos', 'recentSales'] as const,
        invoiceNumber: () => ['pos', 'invoiceNumber'] as const,
        customerSearch: (q: string, limit: number) =>
            ['pos', 'customerSearch', q, limit] as const,
        saleById: (saleId: string) => ['pos', 'saleById', saleId] as const,
        cashierDashboard: () => ['pos', 'cashierDashboard'] as const,
        adminDashboard: () => ['pos', 'adminDashboard'] as const,
        myTransactions: () => ['pos', 'myTransactions'] as const,
        allTransactions: () => ['pos', 'allTransactions'] as const,
    },
} as const;
