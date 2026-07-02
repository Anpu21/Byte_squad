export const customers = {
    list: (params: unknown) => ['customers', 'list', params] as const,
    detail: (key: string) => ['customers', 'detail', key] as const,
    analytics: (params: unknown) =>
        ['customers', 'analytics', params] as const,
} as const;
