export const notifications = {
    list: () => ['notifications', 'list'] as const,
    byId: (id: string) => ['notifications', 'by-id', id] as const,
} as const;
