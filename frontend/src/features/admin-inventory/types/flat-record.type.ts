import type {
    IInventoryMatrixBranchColumn,
    IInventoryMatrixCell,
    IInventoryMatrixRow,
} from '@/types';
import type { StockKey } from './stock-key.type';

export interface FlatRecord {
    key: string;
    row: IInventoryMatrixRow;
    branch: IInventoryMatrixBranchColumn;
    cell: IInventoryMatrixCell;
    stockKey: StockKey;
}
