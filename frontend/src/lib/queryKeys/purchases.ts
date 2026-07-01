export const purchases = {
    all: () => ['purchases'] as const,
    reorder: (params: {
        branchId?: string;
        leadDays?: number;
        lookbackDays?: number;
    }) => ['purchases', 'reorder', params] as const,
    suppliers: (params: {
        search?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }) => ['purchases', 'suppliers', params] as const,
    supplier: (id: string) => ['purchases', 'supplier', id] as const,
    grns: (params: {
        supplierId?: string;
        branchId?: string;
        status?: string;
        paymentStatus?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }) => ['purchases', 'grns', params] as const,
    grn: (id: string) => ['purchases', 'grn', id] as const,
    payments: (params: {
        supplierId?: string;
        limit?: number;
        offset?: number;
    }) => ['purchases', 'payments', params] as const,
    orders: (params: {
        supplierId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }) => ['purchases', 'orders', params] as const,
    outstanding: () => ['purchases', 'outstanding'] as const,
    ageing: () => ['purchases', 'ageing'] as const,
    returnsForGrn: (grnId: string) =>
        ['purchases', 'returns', grnId] as const,
} as const;
