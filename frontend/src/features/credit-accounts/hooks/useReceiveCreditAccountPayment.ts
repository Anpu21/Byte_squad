import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IReceiveCreditAccountPaymentPayload } from '@/types';

/**
 * `POST /credit-accounts/:id/payments`. Settling credit changes the account
 * balance, its unpaid sales, and the ledger — so invalidate all three.
 */
export function useReceiveCreditAccountPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      payload: IReceiveCreditAccountPaymentPayload;
    }) => creditAccountsService.receivePayment(input.id, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
      void queryClient.invalidateQueries({ queryKey: ['ledger'] });
      void queryClient.invalidateQueries({ queryKey: ['pos'] });
    },
  });
}
