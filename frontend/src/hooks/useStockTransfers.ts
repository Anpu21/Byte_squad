import { useCallback, useEffect, useState } from 'react';
import {
    stockTransfersService,
    type IStockTransferRequest,
    type IListTransfersParams,
    type IListTransferHistoryParams,
} from '@/services/stock-transfers.service';

type TransferScope = 'my-requests' | 'incoming' | 'admin';

interface UseStockTransfersOptions {
    scope: TransferScope;
    autoFetch?: boolean;
}

export function useStockTransfers({
    scope,
    autoFetch = true,
}: UseStockTransfersOptions) {
    const [items, setItems] = useState<IStockTransferRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [params, setParams] = useState<IListTransfersParams>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetcher = useCallback(
        async (queryParams: IListTransfersParams) => {
            setIsLoading(true);
            setError(null);
            try {
                let result;
                if (scope === 'my-requests') {
                    result = await stockTransfersService.listMyRequests(
                        queryParams,
                    );
                } else if (scope === 'incoming') {
                    result = await stockTransfersService.listIncoming(
                        queryParams,
                    );
                } else {
                    result = await stockTransfersService.listAll(queryParams);
                }
                setItems(result.items ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 0);
            } catch {
                setError('Failed to load transfers');
            } finally {
                setIsLoading(false);
            }
        },
        [scope],
    );

    useEffect(() => {
        if (autoFetch) {
            fetcher({ ...params, page, limit: 20 });
        }
    }, [autoFetch, fetcher, params, page]);

    const refetch = useCallback(() => {
        fetcher({ ...params, page, limit: 20 });
    }, [fetcher, params, page]);

    return {
        items,
        total,
        totalPages,
        page,
        setPage,
        params,
        setParams,
        isLoading,
        error,
        refetch,
    };
}

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
