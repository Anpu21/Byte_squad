import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IStockTransferRequest } from '@/types';
import { BOARD_COLUMNS } from '../lib/column-config';
import type { TransferBoardGroup } from '../types/transfer-board-group.type';

const BOARD_PARAMS = { page: 1, limit: 500 } as const;

export interface BoardData {
    isLoading: boolean;
    columns: Record<string, TransferBoardGroup[]>;
    total: number;
    error: unknown;
}

function groupColumn(items: IStockTransferRequest[]): TransferBoardGroup[] {
    const byKey = new Map<string, IStockTransferRequest[]>();
    for (const transfer of items) {
        const key = transfer.batchId ?? `row:${transfer.id}`;
        const arr = byKey.get(key) ?? [];
        arr.push(transfer);
        byKey.set(key, arr);
    }

    const groups: TransferBoardGroup[] = [];
    for (const [key, transfers] of byKey.entries()) {
        transfers.sort((a, b) => {
            const delta =
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime();
            return delta !== 0 ? delta : a.id.localeCompare(b.id);
        });
        groups.push({
            key,
            batchId: transfers[0].batchId,
            transfers,
            primary: transfers[0],
        });
    }
    groups.sort(
        (a, b) =>
            new Date(b.primary.updatedAt).getTime() -
            new Date(a.primary.updatedAt).getTime(),
    );
    return groups;
}

export function useTransferBoardData(): BoardData {
    const listQuery = useQuery({
        queryKey: queryKeys.stockTransfers.all(BOARD_PARAMS),
        queryFn: () => stockTransfersService.listAll(BOARD_PARAMS),
    });

    const grouped = useMemo<Record<string, TransferBoardGroup[]>>(() => {
        const buckets: Record<string, IStockTransferRequest[]> =
            Object.fromEntries(BOARD_COLUMNS.map((col) => [col.id, []]));
        for (const transfer of listQuery.data?.items ?? []) {
            const column = BOARD_COLUMNS.find((col) =>
                col.statuses.includes(transfer.status),
            );
            if (column) {
                buckets[column.id]?.push(transfer);
            }
        }
        const out: Record<string, TransferBoardGroup[]> = {};
        for (const col of BOARD_COLUMNS) {
            out[col.id] = groupColumn(buckets[col.id] ?? []);
        }
        return out;
    }, [listQuery.data]);

    return {
        isLoading: listQuery.isLoading,
        columns: grouped,
        total: listQuery.data?.total ?? 0,
        error: listQuery.error,
    };
}
