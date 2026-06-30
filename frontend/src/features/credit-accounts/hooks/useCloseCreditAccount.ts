import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';

/** `PATCH /credit-accounts/:id/close` — permanently close an account. */
export function useCloseCreditAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditAccountsService.close(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
