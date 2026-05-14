import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IStockTransferRequest } from '@/types';
import { BOARD_COLUMNS } from '../lib/column-config';

const BOARD_PARAMS = { page: 1, limit: 500 } as const;

export interface BoardData {
    isLoading: boolean;
    columns: Record<string, IStockTransferRequest[]>;
    total: number;
    error: unknown;
}

export function useTransferBoardData(): BoardData {
    const listQuery = useQuery({
        queryKey: queryKeys.stockTransfers.all(BOARD_PARAMS),
        queryFn: () => stockTransfersService.listAll(BOARD_PARAMS),
    });

    const grouped = useMemo<Record<string, IStockTransferRequest[]>>(() => {
        const map: Record<string, IStockTransferRequest[]> =
            Object.fromEntries(BOARD_COLUMNS.map((col) => [col.id, []]));
        for (const transfer of listQuery.data?.items ?? []) {
            const column = BOARD_COLUMNS.find((col) =>
                col.statuses.includes(transfer.status),
            );
            if (column) {
                map[column.id]?.push(transfer);
            }
        }
        for (const list of Object.values(map)) {
            list.sort(
                (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime(),
            );
        }
        return map;
    }, [listQuery.data]);

    return {
        isLoading: listQuery.isLoading,
        columns: grouped,
        total: listQuery.data?.total ?? 0,
        error: listQuery.error,
    };
}
