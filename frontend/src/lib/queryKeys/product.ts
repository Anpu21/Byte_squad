export const product = {
    all: () => ['product'] as const,
    byId: (id: string) => ['product', 'by-id', id] as const,
} as const;
