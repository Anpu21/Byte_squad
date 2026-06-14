import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';
import type { PurchaseOrderStatus } from '@/types';

/** Wraps `GET /purchases/orders` (managers are branch-pinned). */
export function usePurchaseOrders(
    args: {
        supplierId?: string;
        status?: PurchaseOrderStatus;
        limit?: number;
        offset?: number;
    } = {},
) {
    return useQuery({
        queryKey: queryKeys.purchases.orders(args),
        queryFn: () => purchasesService.listOrders(args),
        staleTime: 15_000,
    });
}
