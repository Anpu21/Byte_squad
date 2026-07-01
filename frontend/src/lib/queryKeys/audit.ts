export const audit = {
    logs: (params: Record<string, string | number | undefined>) =>
        ['audit', 'logs', params] as const,
} as const;
