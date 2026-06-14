import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IPurchaseOrderPayload } from '@/types';

/**
 * PO mutations (create / send / cancel) bundled — they share one tiny
 * invalidation footprint (orders are intent-only; no stock or ledger).
 */
export function usePurchaseOrderMutations() {
    const queryClient = useQueryClient();
    const invalidate = () =>
        void queryClient.invalidateQueries({
            queryKey: queryKeys.purchases.all(),
        });

    const create = useMutation({
        mutationFn: (payload: IPurchaseOrderPayload) =>
            purchasesService.createOrder(payload),
        onSuccess: invalidate,
    });
    const send = useMutation({
        mutationFn: (id: string) => purchasesService.sendOrder(id),
        onSuccess: invalidate,
    });
    const cancel = useMutation({
        mutationFn: (id: string) => purchasesService.cancelOrder(id),
        onSuccess: invalidate,
    });

    return { create, send, cancel };
}
