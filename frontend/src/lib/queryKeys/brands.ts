export const brands = {
    all: () => ['brands'] as const,
    list: (includeInactive: boolean) =>
        ['brands', 'list', includeInactive] as const,
    detail: (id: string) => ['brands', 'detail', id] as const,
    overview: (params: unknown) =>
        ['brands', 'analytics', 'overview', params] as const,
    drilldown: (brandId: string, params: unknown) =>
        ['brands', 'analytics', brandId, params] as const,
} as const;
