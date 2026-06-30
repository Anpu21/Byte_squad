export const ledger = {
    entries: (filters: {
        entryType?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page: number;
        limit: number;
    }) => ['ledger', 'entries', filters] as const,
    summary: () => ['ledger', 'summary'] as const,
    accounts: () => ['ledger', 'accounts'] as const,
    trialBalance: (params: Record<string, string | undefined>) =>
        ['ledger', 'trial-balance', params] as const,
    balanceSheet: (params: Record<string, string | undefined>) =>
        ['ledger', 'balance-sheet', params] as const,
    dayBook: (params: Record<string, string | undefined>) =>
        ['ledger', 'day-book', params] as const,
    periods: (year: number) => ['ledger', 'periods', year] as const,
} as const;
