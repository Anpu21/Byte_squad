export const shop = {
    branches: () => ['shop', 'branches'] as const,
    branchesWithStaff: () => ['shop', 'branches-with-staff'] as const,
    categories: () => ['shop', 'categories'] as const,
    products: (params: unknown) => ['shop', 'products', params] as const,
    recommended: (params: unknown) =>
        ['shop', 'recommended', params] as const,
    publicProduct: (id: string, branchId: string | null) =>
        ['shop', 'public-product', id, branchId] as const,
} as const;
