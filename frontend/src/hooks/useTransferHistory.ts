import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IListTransferHistoryParams } from '@/types';

interface UseTransferHistoryOptions {
    initialFilters?: IListTransferHistoryParams;
    autoFetch?: boolean;
}

const PAGE_LIMIT = 20;

export function useTransferHistory({
    initialFilters,
    autoFetch = true,
}: UseTransferHistoryOptions = {}) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<IListTransferHistoryParams>(
        initialFilters ?? {},
    );

    const fullParams: IListTransferHistoryParams = {
        ...filters,
        page,
        limit: PAGE_LIMIT,
    };

    const query = useQuery({
        queryKey: queryKeys.stockTransfers.history(fullParams),
        queryFn: () => stockTransfersService.getHistory(fullParams),
        enabled: autoFetch,
    });

    const updateFilters = useCallback((next: IListTransferHistoryParams) => {
        setFilters(next);
        setPage(1);
    }, []);

    const refetch = () => {
        queryClient.invalidateQueries({
            queryKey: queryKeys.stockTransfers.history(fullParams),
        });
    };

    return {
        items: query.data?.items ?? [],
        total: query.data?.total ?? 0,
        totalPages: query.data?.totalPages ?? 0,
        page,
        setPage,
        filters,
        updateFilters,
        isLoading: query.isLoading,
        error: query.error ? 'Failed to load transfer history' : null,
        refetch,
    };
}
