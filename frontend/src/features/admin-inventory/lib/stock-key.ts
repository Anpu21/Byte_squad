import type { IInventoryMatrixCell } from '@/types';
import type { StockKey } from '../types/stock-key.type';

export function getStockKey(cell: IInventoryMatrixCell): StockKey {
    if (cell.isOutOfStock) return 'out_of_stock';
    if (cell.isLowStock) return 'low_stock';
    return 'in_stock';
}
