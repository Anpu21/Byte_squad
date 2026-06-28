import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';

/** `PATCH /credit-accounts/:id/suspend` — freeze an ACTIVE account. */
export function useSuspendCreditAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditAccountsService.suspend(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
