import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IApproveCreditAccountPayload } from '@/types';

/** `PATCH /credit-accounts/:id/approve` — set limit + term, move to ACTIVE. */
export function useApproveCreditAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      payload: IApproveCreditAccountPayload;
    }) => creditAccountsService.approve(input.id, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.creditAccounts.all(),
      });
    },
  });
}
