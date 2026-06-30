export const customerOrders = {
    all: () => ['customer-orders'] as const,
    list: (filters: { statusFilter: string; search: string }) =>
        ['customer-orders', filters] as const,
    my: () => ['my-customer-orders'] as const,
    byCode: (code: string) =>
        ['customer-order-by-code', code] as const,
} as const;
