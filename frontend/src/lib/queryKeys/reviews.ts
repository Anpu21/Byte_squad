export const reviews = {
    forProduct: (productId: string, params: unknown) =>
        ['reviews', 'product', productId, params] as const,
    byProduct: (productId: string) =>
        ['reviews', 'product', productId] as const,
    moderation: (params: unknown) =>
        ['reviews', 'moderation', params] as const,
} as const;
