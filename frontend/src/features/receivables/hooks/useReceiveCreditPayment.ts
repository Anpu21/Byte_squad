import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receivablesService } from '@/services/receivables.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IReceiveCreditPaymentPayload } from '@/types';

/**
 * `POST /pos/receivables/:userId/payments`. Settling credit changes the
 * customer balance, unpaid sales, and the ledger.
 */
export function useReceiveCreditPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: {
            userId: string;
            payload: IReceiveCreditPaymentPayload;
        }) => receivablesService.receivePayment(input.userId, input.payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.receivables.all(),
            });
            void queryClient.invalidateQueries({ queryKey: ['ledger'] });
            void queryClient.invalidateQueries({ queryKey: ['pos'] });
        },
    });
}
