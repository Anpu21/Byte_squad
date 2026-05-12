/**
 * Centralized TanStack Query key factory.
 *
 * Rules.md §6 mandates a single source of truth for query keys per feature.
 * This file is the migration target. PR 1 includes the keys we use now;
 * future PRs will migrate the remaining inline keys (CatalogPage, MyRequests,
 * Expenses, etc.) into this same factory.
 */

import type { IInventoryParams, IListTransfersParams, IListTransferHistoryParams } from '@/types';

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
    },
    inventory: {
        all: () => ['inventory'] as const,
        categories: () => ['inventory', 'categories'] as const,
        byBranch: (branchId: string, params?: IInventoryParams) =>
            ['inventory', 'by-branch', branchId, params ?? {}] as const,
    },
    notifications: {
        list: () => ['notifications', 'list'] as const,
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
    },
    branches: {
        all: () => ['branches'] as const,
    },
    shop: {
        branches: () => ['shop', 'branches'] as const,
    },
    profile: {
        self: () => ['profile'] as const,
    },
} as const;
