import { useCallback, useEffect, useState } from 'react';
import { stockTransfersService } from '@/services/stock-transfers.service';
import type {
    IStockTransferRequest,
    IListTransfersParams,
} from '@/types';

// Re-export so callers that previously did `import { useTransferHistory } from
// '@/hooks/useStockTransfers'` keep working.
export { useTransferHistory } from '@/hooks/useTransferHistory';

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
