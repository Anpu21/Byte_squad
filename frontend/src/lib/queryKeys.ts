/**
 * Centralized TanStack Query key factory.
 *
 * Rules.md §6 mandates a single source of truth for query keys per feature.
 * This file is the migration target — only keys actually consumed by current
 * code live here. Other features will be migrated PR-by-PR.
 */

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
    },
    inventory: {
        categories: () => ['inventory', 'categories'] as const,
    },
} as const;
