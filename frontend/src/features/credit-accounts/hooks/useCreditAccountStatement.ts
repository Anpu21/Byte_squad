import { useQuery } from '@tanstack/react-query';
import { creditAccountsService } from '@/services/credit-accounts.service';
import { queryKeys } from '@/lib/queryKeys';

/** `GET /credit-accounts/:id/statement`. Disabled until an id is selected. */
export function useCreditAccountStatement(id: string | null) {
  return useQuery({
    queryKey: queryKeys.creditAccounts.statement(id ?? ''),
    queryFn: () => creditAccountsService.statement(id ?? ''),
    enabled: id !== null,
  });
}
