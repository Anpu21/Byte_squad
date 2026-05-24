import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Customer typeahead backing the cashier customer picker. The caller is
 * responsible for debouncing `q`; the hook only fires once the trimmed
 * query is non-empty so the first focus event doesn't blast the API.
 *
 * `staleTime` matches the product-search hook — the rows are cheap to
 * fetch but stable enough that a 30s SWR window keeps the picker snappy
 * when the cashier reopens it during the same checkout.
 */
export function usePosCustomerSearch(q: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.pos.customerSearch(q, limit),
    queryFn: () => posService.searchCustomers(q, limit),
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  });
}
