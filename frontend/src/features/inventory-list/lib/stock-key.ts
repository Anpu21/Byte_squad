import type { IInventoryWithProduct } from '@/types';
import type { StockKey } from '../types/stock-key.type';

export function getStockKey(item: IInventoryWithProduct): StockKey {
    if (item.quantity === 0) return 'out_of_stock';
    if (item.quantity <= item.lowStockThreshold) return 'low_stock';
    return 'in_stock';
}

export const STOCK_LABEL: Record<StockKey, string> = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
};

export const STOCK_OPTIONS: { value: '' | StockKey; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'in_stock', label: 'In stock' },
    { value: 'low_stock', label: 'Low stock' },
    { value: 'out_of_stock', label: 'Out of stock' },
];
