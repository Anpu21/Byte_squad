import { useMemo } from 'react';
import type { IInventoryMatrixResponse } from '@/types';
import type { FlatRecord } from '../types/flat-record.type';
import type { StockKey } from '../types/stock-key.type';
import { getStockKey } from '../lib/stock-key';

interface FlatRecordsResult {
    list: FlatRecord[];
    outOfStockCount: number;
}

interface FlatRecordsInput {
    branchId: string;
    stockStatus: '' | StockKey;
}

export function useFlatRecords(
    matrix: IInventoryMatrixResponse | undefined,
    { branchId, stockStatus }: FlatRecordsInput,
): FlatRecordsResult {
    return useMemo<FlatRecordsResult>(() => {
        if (!matrix) return { list: [], outOfStockCount: 0 };
        const branchById = new Map(matrix.branches.map((b) => [b.id, b]));
        const list: FlatRecord[] = [];
        let outOfStockCount = 0;
        for (const row of matrix.rows) {
            for (const cell of row.cells) {
                // Skip "no record" cells — flat view shows only real records.
                if (cell.inventoryId === null) continue;
                const branch = branchById.get(cell.branchId);
                if (!branch) continue;
                if (branchId && branch.id !== branchId) continue;
                const stockKey = getStockKey(cell);
                if (stockStatus && stockKey !== stockStatus) continue;
                if (stockKey === 'out_of_stock') outOfStockCount++;
                list.push({
                    key: `${row.productId}:${branch.id}`,
                    row,
                    branch,
                    cell,
                    stockKey,
                });
            }
        }
        return { list, outOfStockCount };
    }, [matrix, branchId, stockStatus]);
}
