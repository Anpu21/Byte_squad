import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ISupplierPaymentPayload } from '@/types';

/**
 * `POST /purchases/payments`. Settling bills changes GRN payment state and
 * every payables report — invalidate the whole purchases namespace.
 */
export function useCreateSupplierPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ISupplierPaymentPayload) =>
            purchasesService.createPayment(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            });
        },
    });
}
