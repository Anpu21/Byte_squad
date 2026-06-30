import type { IExpiryReportParams } from '@/types';

export const expiry = {
    report: (params?: IExpiryReportParams) =>
        ['expiry', 'report', params ?? {}] as const,
    batches: (productId: string) =>
        ['expiry', 'batches', productId] as const,
} as const;
