export const adminLoyalty = {
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
        userId: string,
        params: { limit?: number; offset?: number },
    ) => ['admin-loyalty', 'customer-history', userId, params] as const,
} as const;
