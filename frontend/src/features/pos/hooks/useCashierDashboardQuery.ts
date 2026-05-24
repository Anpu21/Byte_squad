import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Drives the cashier dashboard page. The cashier scope is JWT-derived on
 * the server so the FE issues a zero-arg GET. `staleTime` is 30s so the
 * page does not thrash when the cashier flips between tabs, but a sale
 * mutation will invalidate this key immediately for fresh totals.
 */
export function useCashierDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.pos.cashierDashboard(),
    queryFn: () => posService.getCashierDashboard(),
    staleTime: 30_000,
  });
}
