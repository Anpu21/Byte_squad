export const categories = {
    all: () => ['categories'] as const,
    list: (includeInactive: boolean) =>
        ['categories', 'list', includeInactive] as const,
    analytics: (params: unknown) =>
        ['categories', 'analytics', params] as const,
} as const;
