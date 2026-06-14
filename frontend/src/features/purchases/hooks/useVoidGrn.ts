import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** `POST /purchases/grns/:id/void` — admin only; reverses stock + ledger. */
export function useVoidGrn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { id: string; reason: string }) =>
            purchasesService.voidGrn(input.id, input.reason),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['ledger'] });
        },
    });
}
