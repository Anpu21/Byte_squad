import type { StockKey } from './types/stock-key.type';

export const PAGE_LIMIT = 25;

export const STOCK_OPTIONS: { value: '' | StockKey; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'in_stock', label: 'In stock' },
    { value: 'low_stock', label: 'Low stock' },
    { value: 'out_of_stock', label: 'Out of stock' },
];

export const STOCK_LABEL: Record<StockKey, string> = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
};
