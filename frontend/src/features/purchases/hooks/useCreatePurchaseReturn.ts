import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IPurchaseReturnPayload } from '@/types';

/**
 * `POST /purchases/returns`. A debit note moves stock, the bill, the
 * ledger, and every payables report — invalidate broadly.
 */
export function useCreatePurchaseReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IPurchaseReturnPayload) =>
            purchasesService.createReturn(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['ledger'] });
        },
    });
}
