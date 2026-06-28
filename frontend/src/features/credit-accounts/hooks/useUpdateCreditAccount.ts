import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IUpdateCreditAccountPayload } from '@/types';

/** `PATCH /credit-accounts/:id` — edit credit limit / term on an ACTIVE account. */
export function useUpdateCreditAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; payload: IUpdateCreditAccountPayload }) =>
      creditAccountsService.update(input.id, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
