export const pos = {
    all: () => ['pos'] as const,
    searchProducts: (q: string, limit: number) =>
        ['pos', 'searchProducts', q, limit] as const,
    productUnits: (productId: string) =>
        ['pos', 'productUnits', productId] as const,
    productInventory: (productId: string) =>
        ['pos', 'productInventory', productId] as const,
    productInventoryAll: () => ['pos', 'productInventory'] as const,
    recentSales: (limit: number) =>
        ['pos', 'recentSales', limit] as const,
    recentSalesAll: () => ['pos', 'recentSales'] as const,
    invoiceNumber: () => ['pos', 'invoiceNumber'] as const,
    customerSearch: (q: string, limit: number) =>
        ['pos', 'customerSearch', q, limit] as const,
    saleById: (saleId: string) => ['pos', 'saleById', saleId] as const,
    cashierDashboard: () => ['pos', 'cashierDashboard'] as const,
    adminDashboard: () => ['pos', 'adminDashboard'] as const,
    myTransactions: () => ['pos', 'myTransactions'] as const,
    allTransactions: () => ['pos', 'allTransactions'] as const,
    schemes: (isActive?: boolean) =>
        ['pos', 'schemes', { isActive }] as const,
    schemesAll: () => ['pos', 'schemes'] as const,
    activeSchemes: () => ['pos', 'activeSchemes'] as const,
    salesmanReport: (params: {
        startDate?: string;
        endDate?: string;
        branchId?: string;
    }) => ['pos', 'salesmanReport', params] as const,
} as const;
