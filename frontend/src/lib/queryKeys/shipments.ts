export const shipments = {
    all: () => ['shipments'] as const,
    list: (params: {
        status?: string
        branchId?: string
        page?: number
        limit?: number
    }) => ['shipments', 'list', params] as const,
    detail: (id: string) => ['shipments', 'detail', id] as const,
} as const;
