import { useCallback, useEffect, useState } from 'react';
import { stockTransfersService } from '@/services/stock-transfers.service';
import type {
    IStockTransferRequest,
    IListTransferHistoryParams,
} from '@/types';

interface UseTransferHistoryOptions {
    initialFilters?: IListTransferHistoryParams;
    autoFetch?: boolean;
}

export function useTransferHistory({
    initialFilters,
    autoFetch = true,
}: UseTransferHistoryOptions = {}) {
    const [items, setItems] = useState<IStockTransferRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<IListTransferHistoryParams>(
        initialFilters ?? {},
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetcher = useCallback(
        async (queryParams: IListTransferHistoryParams) => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await stockTransfersService.getHistory(
                    queryParams,
                );
                setItems(result.items ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 0);
            } catch {
                setError('Failed to load transfer history');
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (autoFetch) {
            fetcher({ ...filters, page, limit: 20 });
        }
    }, [autoFetch, fetcher, filters, page]);

    const updateFilters = useCallback(
        (next: IListTransferHistoryParams) => {
            setFilters(next);
            setPage(1);
        },
        [],
    );

    const refetch = useCallback(() => {
        fetcher({ ...filters, page, limit: 20 });
    }, [fetcher, filters, page]);

    return {
        items,
        total,
        totalPages,
        page,
        setPage,
        filters,
        updateFilters,
        isLoading,
        error,
        refetch,
    };
}
