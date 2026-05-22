import { useMemo } from 'react';
import { useInventoryByBranchQuery } from '@/hooks/useInventoryByBranchQuery';

const POS_STOCK_LIMIT = 1000;

export function useBranchStockMap(
    branchId: string | null | undefined,
): Record<string, number> {
    const query = useInventoryByBranchQuery(
        branchId,
        { limit: POS_STOCK_LIMIT },
        { enabled: Boolean(branchId) },
    );

    return useMemo(() => {
        const map: Record<string, number> = {};
        for (const inv of query.data?.items ?? []) {
            map[inv.product.id] = inv.quantity;
        }
        return map;
    }, [query.data]);
}
