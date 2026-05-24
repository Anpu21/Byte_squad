import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Discriminator picks which endpoint to hit.
 *
 * - `mine`: `GET /pos/my-transactions` — current-user-scoped rollup. The
 *   backend infers branch vs cashier scope from the JWT role.
 * - `all`: `GET /pos/all-transactions` — system-wide rollup. Admin only.
 *
 * The caller is responsible for gating the `all` scope on the user's role
 * before mounting the hook; the server will still reject unauthorized
 * requests but the FE should not waste a roundtrip.
 */
export type TTransactionsScope = 'mine' | 'all';

interface UseTransactionsQueryArgs {
  scope: TTransactionsScope;
  enabled?: boolean;
}

export function useTransactionsQuery({
  scope,
  enabled = true,
}: UseTransactionsQueryArgs) {
  const queryKey =
    scope === 'mine'
      ? queryKeys.pos.myTransactions()
      : queryKeys.pos.allTransactions();
  const queryFn =
    scope === 'mine'
      ? () => posService.getMyTransactions()
      : () => posService.getAllTransactions();
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 30_000,
    enabled,
  });
}
