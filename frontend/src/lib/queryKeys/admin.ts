export interface AdminInventoryMatrixFilters {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    page: number;
    limit: number;
}

export const admin = {
    inventoryMatrix: (filters: AdminInventoryMatrixFilters) =>
        ['admin', 'inventory-matrix', filters] as const,
    overview: () => ['admin', 'overview'] as const,
    branches: () => ['admin', 'branches'] as const,
    comparison: (submitted: unknown) =>
        ['admin', 'comparison', submitted] as const,
    branchAnalyticsComparison: (submitted: unknown) =>
        ['admin', 'branch-analytics-comparison', submitted] as const,
    branchAnalyticsBranches: () =>
        ['admin', 'branch-analytics-branches'] as const,
    dashboard: () => ['admin', 'dashboard'] as const,
} as const;
