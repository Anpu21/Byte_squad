import type { IReturnsAnalyticsParams, IReturnsParams } from '@/types';

export const returns = {
    lookup: (invoiceNumber: string) =>
        ['returns', 'lookup', invoiceNumber] as const,
    list: (params?: IReturnsParams) =>
        ['returns', 'list', params ?? {}] as const,
    analytics: (params?: IReturnsAnalyticsParams) =>
        ['returns', 'analytics', params ?? {}] as const,
} as const;
