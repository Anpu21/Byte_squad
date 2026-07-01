export const transactions = {
    summary: (scope: string) =>
        ['transactions-summary', scope] as const,
} as const;
