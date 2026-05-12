import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { TransferStatus } from '@/constants/enums';
import { queryKeys } from '@/lib/queryKeys';
import { COUNT_STATUSES, type StatusFilter } from '../lib/filter-tabs';

const PAGE_LIMIT = 20;

export function useAdminTransfersPage() {
    const [filter, setFilter] = useState<StatusFilter>(TransferStatus.PENDING);
    const [page, setPage] = useState(1);

    const listParams = {
        status: filter === 'all' ? undefined : filter,
        page,
        limit: PAGE_LIMIT,
    };

    const listQuery = useQuery({
        queryKey: queryKeys.stockTransfers.all(listParams),
        queryFn: () => stockTransfersService.listAll(listParams),
    });

    const countsQuery = useQuery({
        queryKey: queryKeys.stockTransfers.counts(),
        queryFn: async () => {
            const entries = await Promise.all(
                COUNT_STATUSES.map((s) =>
                    stockTransfersService
                        .listAll({ status: s, page: 1, limit: 1 })
                        .then((r) => [s, r.total] as const)
                        .catch(() => [s, 0] as const),
                ),
            );
            const map: Record<string, number> = {};
            let total = 0;
            for (const [s, count] of entries) {
                map[s] = count;
                total += count;
            }
            map.all = total;
            return map;
        },
    });

    const changeFilter = (next: StatusFilter) => {
        setFilter(next);
        setPage(1);
    };

    return {
        filter,
        changeFilter,
        items: listQuery.data?.items ?? [],
        totalPages: listQuery.data?.totalPages ?? 0,
        isLoading: listQuery.isLoading,
        counts: countsQuery.data ?? {},
        page,
        setPage,
    };
}
