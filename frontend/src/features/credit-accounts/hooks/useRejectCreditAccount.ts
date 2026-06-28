import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IRejectCreditAccountPayload } from '@/types';

/** `PATCH /credit-accounts/:id/reject` — decline a PENDING request. */
export function useRejectCreditAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; payload: IRejectCreditAccountPayload }) =>
      creditAccountsService.reject(input.id, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
