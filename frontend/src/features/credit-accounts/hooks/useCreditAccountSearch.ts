import { useQuery } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * `GET /credit-accounts/search` — the POS account picker. Disabled until at
 * least one character is typed; results are ACTIVE accounts in-branch.
 */
export function useCreditAccountSearch(q: string, branchId?: string) {
  const term = q.trim();
  return useQuery({
    queryKey: queryKeys.creditAccounts.search(term, branchId),
    queryFn: () => creditAccountsService.search({ q: term, branchId }),
    enabled: term.length >= 1,
    staleTime: 10_000,
  });
}
