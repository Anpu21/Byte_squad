import type {
    IListTransfersParams,
    IListTransferHistoryParams,
} from '@/types';

export const stockTransfers = {
    myRequests: (params?: IListTransfersParams) =>
        ['stock-transfers', 'my-requests', params ?? {}] as const,
    incoming: (params?: IListTransfersParams) =>
        ['stock-transfers', 'incoming', params ?? {}] as const,
    all: (params?: IListTransfersParams) =>
        ['stock-transfers', 'all', params ?? {}] as const,
    history: (params?: IListTransferHistoryParams) =>
        ['stock-transfers', 'history', params ?? {}] as const,
    byId: (id: string) => ['stock-transfers', 'by-id', id] as const,
    sourceOptions: (id: string) =>
        ['stock-transfers', 'source-options', id] as const,
    counts: () => ['stock-transfers', 'counts'] as const,
    analytics: (params: unknown) =>
        ['stock-transfers', 'analytics', params] as const,
} as const;
