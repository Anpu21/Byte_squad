import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IGrnPayload } from '@/types';

/**
 * `POST /purchases/grns`. A receive changes stock, product cost, and the
 * ledger — invalidate those namespaces alongside purchases.
 */
export function useCreateGrn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IGrnPayload) =>
            purchasesService.createGrn(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['product'] });
            void queryClient.invalidateQueries({ queryKey: ['ledger'] });
        },
    });
}
