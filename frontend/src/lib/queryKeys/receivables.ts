export const receivables = {
    all: () => ['receivables'] as const,
    list: () => ['receivables', 'list'] as const,
    statement: (userId: string) =>
        ['receivables', 'statement', userId] as const,
} as const;
