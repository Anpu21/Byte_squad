export const brands = {
    all: () => ['brands'] as const,
    list: (includeInactive: boolean) =>
        ['brands', 'list', includeInactive] as const,
    detail: (id: string) => ['brands', 'detail', id] as const,
    overview: (params: unknown) =>
        ['brands', 'analytics', 'overview', params] as const,
    drilldown: (brandId: string, params: unknown) =>
        ['brands', 'analytics', brandId, params] as const,
    categoryComparison: (categoryId: string, params: unknown) =>
        ['brands', 'analytics', 'by-category', categoryId, params] as const,
    categoryProducts: (categoryId: string, params: unknown) =>
        ['brands', 'analytics', 'by-category', categoryId, 'products', params] as const,
    byBranch: (request: unknown) =>
        ['brands', 'analytics', 'by-branch', request] as const,
    byBranchProducts: (request: unknown) =>
        ['brands', 'analytics', 'by-branch', 'products', request] as const,
    byBranchTrend: (request: unknown) =>
        ['brands', 'analytics', 'by-branch', 'trend', request] as const,
} as const;
