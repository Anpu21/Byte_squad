import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IPurchaseOrderPayload } from '@/types';

export interface IReorderParams {
    branchId?: string;
    leadDays?: number;
    lookbackDays?: number;
}

/**
 * On-demand reorder suggestions for a branch. Disabled until a branch is
 * resolvable (managers are pinned server-side; admins must pick one).
 */
export function useReorderSuggestions(params: IReorderParams, enabled: boolean) {
    return useQuery({
        queryKey: queryKeys.purchases.reorder(params),
        queryFn: () => purchasesService.reorderSuggestions(params),
        enabled,
        staleTime: 30_000,
    });
}

/** Draft one Purchase Order per supplier from approved suggestions. */
export function useDraftReorders() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orders: IPurchaseOrderPayload[]) =>
            purchasesService.draftReorders(orders),
        onSuccess: () =>
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            }),
    });
}
