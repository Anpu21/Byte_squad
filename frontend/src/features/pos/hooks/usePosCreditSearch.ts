import { useQuery } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';

const MIN_SEARCH_CHARS = 2;

/**
 * POS credit-account typeahead. Searches ACTIVE accounts in the cashier's
 * branch by phone, name, or account no — branch scoping is server-side (the
 * cashier's `actor.branchId`), so no branchId is sent. Gated on 2+ characters.
 */
export function usePosCreditSearch(query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: queryKeys.creditAccounts.search(term),
    queryFn: () => creditAccountsService.search({ q: term }),
    enabled: term.length >= MIN_SEARCH_CHARS,
    staleTime: 10_000,
  });
}
