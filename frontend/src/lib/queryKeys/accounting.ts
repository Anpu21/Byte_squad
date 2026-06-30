export const accounting = {
    profitLoss: (startDate: string, endDate: string) =>
        ['accounting', 'profit-loss', startDate, endDate] as const,
} as const;
