import type { IStockAdjustmentsParams } from '@/types';

export const stockAdjustments = {
    list: (params?: IStockAdjustmentsParams) =>
        ['stock-adjustments', 'list', params ?? {}] as const,
    byId: (id: string) => ['stock-adjustments', 'by-id', id] as const,
} as const;
