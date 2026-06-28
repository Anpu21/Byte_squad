import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICreateCreditAccountRequestPayload } from '@/types';

/** `POST /credit-accounts` — submit the cashier enrollment form (→ PENDING). */
export function useCreateCreditAccountRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateCreditAccountRequestPayload) =>
      creditAccountsService.request(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
