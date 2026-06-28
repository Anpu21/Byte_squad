import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICreateCreditAccountRequestPayload, ICreditAccount } from '@/types';

/**
 * POS-side enrollment — the cashier submits the "special form" for a walk-in
 * who isn't yet a credit customer. Creates a PENDING account for a manager to
 * approve; invalidates the credit-accounts list so it lands in their inbox.
 * Does NOT attach: the account can't fund a sale until it's approved.
 */
export function usePosCreditEnroll() {
  const queryClient = useQueryClient();
  return useMutation<ICreditAccount, Error, ICreateCreditAccountRequestPayload>({
    mutationFn: (payload) => creditAccountsService.request(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
