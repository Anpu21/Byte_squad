import type { ShopStockStatus } from '@/types';

export const STOCK_LABEL: Record<ShopStockStatus, string> = {
    in: 'In stock',
    low: 'Low stock',
    out: 'Out of stock',
};

export const STOCK_PILL: Record<ShopStockStatus, string> = {
    in: 'bg-accent-soft text-accent-text border-accent/40',
    low: 'bg-warning-soft text-warning border-warning/40',
    out: 'bg-danger-soft text-danger border-danger/40',
};

export const STOCK_DOT: Record<ShopStockStatus, string> = {
    in: 'bg-accent',
    low: 'bg-warning',
    out: 'bg-danger',
};
