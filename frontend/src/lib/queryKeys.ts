/**
 * Centralized TanStack Query key factory.
 *
 * Rules.md §6 mandates a single source of truth for query keys per feature.
 * Every cross-component query key in the app should live here.
 */

import type {
    IInventoryParams,
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

export const queryKeys = {
    admin: {
        inventoryMatrix: (filters: AdminInventoryMatrixFilters) =>
            ['admin', 'inventory-matrix', filters] as const,
        overview: () => ['admin', 'overview'] as const,
        branches: () => ['admin', 'branches'] as const,
        comparison: (submitted: unknown) =>
            ['admin', 'comparison', submitted] as const,
        dashboard: () => ['admin', 'dashboard'] as const,
    },
    inventory: {
        all: () => ['inventory'] as const,
        categories: () => ['inventory', 'categories'] as const,
        byBranch: (branchId: string, params?: IInventoryParams) =>
            ['inventory', 'by-branch', branchId, params ?? {}] as const,
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
    },
    adminLoyalty: {
        customers: (params: {
            search?: string;
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
            branchId?: string | null;
            entryType?: string;
            startDate?: string;
            endDate?: string;
            search?: string;
            page: number;
            limit: number;
        }) => ['ledger', 'entries', filters] as const,
        summary: (branchId?: string | null) =>
            ['ledger', 'summary', branchId ?? null] as const,
    },
    accounting: {
        profitLoss: (startDate: string, endDate: string) =>
            ['accounting', 'profit-loss', startDate, endDate] as const,
    },
} as const;

