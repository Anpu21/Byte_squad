import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IListTransfersParams } from '@/types';

// Re-export so callers that previously did `import { useTransferHistory } from
// '@/hooks/useStockTransfers'` keep working.
export { useTransferHistory } from '@/hooks/useTransferHistory';

type TransferScope = 'my-requests' | 'incoming' | 'admin';

interface UseStockTransfersOptions {
    scope: TransferScope;
    autoFetch?: boolean;
}

const PAGE_LIMIT = 20;

function buildQueryKey(scope: TransferScope, params: IListTransfersParams) {
    switch (scope) {
        case 'my-requests':
            return queryKeys.stockTransfers.myRequests(params);
        case 'incoming':
            return queryKeys.stockTransfers.incoming(params);
        case 'admin':
            return queryKeys.stockTransfers.all(params);
    }
}

function buildQueryFn(scope: TransferScope, params: IListTransfersParams) {
    switch (scope) {
        case 'my-requests':
            return () => stockTransfersService.listMyRequests(params);
        case 'incoming':
            return () => stockTransfersService.listIncoming(params);
        case 'admin':
            return () => stockTransfersService.listAll(params);
    }
}

export function useStockTransfers({
    scope,
    autoFetch = true,
}: UseStockTransfersOptions) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [params, setParams] = useState<IListTransfersParams>({});

    const fullParams: IListTransfersParams = { ...params, page, limit: PAGE_LIMIT };

    const query = useQuery({
        queryKey: buildQueryKey(scope, fullParams),
        queryFn: buildQueryFn(scope, fullParams),
        enabled: autoFetch,
    });

    const refetch = () => {
        queryClient.invalidateQueries({
            queryKey: buildQueryKey(scope, fullParams),
        });
    };

    return {
        items: query.data?.items ?? [],
        total: query.data?.total ?? 0,
        totalPages: query.data?.totalPages ?? 0,
        page,
        setPage,
        params,
        setParams,
        isLoading: query.isLoading,
        error: query.error ? 'Failed to load transfers' : null,
        refetch,
    };
}

