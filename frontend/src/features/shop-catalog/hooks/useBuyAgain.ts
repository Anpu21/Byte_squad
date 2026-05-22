import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerOrdersService } from '@/services/customer-orders.service';
import { queryKeys } from '@/lib/queryKeys';
import { buyAgainCandidates } from '../lib/buy-again';
import type { IShopProduct } from '@/types';

interface UseBuyAgainArgs {
    catalog: ReadonlyArray<IShopProduct>;
    excludeIds: ReadonlyArray<string>;
    enabled: boolean;
    limit?: number;
}

export function useBuyAgain({
    catalog,
    excludeIds,
    enabled,
    limit = 4,
}: UseBuyAgainArgs) {
    const { data: orders = [] } = useQuery({
        queryKey: queryKeys.customerOrders.my(),
        queryFn: customerOrdersService.listMine,
        enabled,
        staleTime: 60_000,
    });

    return useMemo(
        () => buyAgainCandidates(orders, catalog, excludeIds, limit),
        [orders, catalog, excludeIds, limit],
    );
}
