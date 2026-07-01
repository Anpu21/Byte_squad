export const expenses = {
    all: () => ['expenses'] as const,
    list: (filters: { branchId: string | null; status: string | null }) =>
        ['expenses', filters] as const,
} as const;
