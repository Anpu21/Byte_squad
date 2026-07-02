export const adminLoyalty = {
    dashboard: (role: 'admin' | 'manager') =>
        ['admin-loyalty', 'dashboard', role] as const,
    customers: (params: {
        search?: string;
        branchId?: string;
        activeSince?: string;
        minPoints?: number;
        maxPoints?: number;
        limit?: number;
        offset?: number;
    }) => ['admin-loyalty', 'customers', params] as const,
    customerHistory: (
        memberId: string,
        params: { limit?: number; offset?: number },
    ) => ['admin-loyalty', 'customer-history', memberId, params] as const,
} as const;
