export const customerGroups = {
    all: () => ['customer-groups'] as const,
    mine: () => ['customer-groups', 'mine'] as const,
    detail: (id: string) => ['customer-groups', 'detail', id] as const,
    cart: (id: string) => ['customer-groups', 'cart', id] as const,
    analytics: (id: string, params: unknown) =>
        ['customer-groups', 'analytics', id, params] as const,
} as const;
