import { useQuery } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICreditAccountListParams } from '@/types';

/** `GET /credit-accounts` — manager list (balances + ageing), filterable. */
export function useCreditAccounts(params: ICreditAccountListParams = {}) {
  return useQuery({
    queryKey: queryKeys.creditAccounts.list(params),
    queryFn: () => creditAccountsService.list(params),
    staleTime: 15_000,
  });
}
