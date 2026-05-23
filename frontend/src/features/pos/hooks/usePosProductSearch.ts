import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Debounced product typeahead used by the cashier search box. The caller
 * is responsible for debouncing `q`; the hook only runs when the trimmed
 * query is non-empty.
 */
export function usePosProductSearch(q: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.pos.searchProducts(q, limit),
    queryFn: () => posService.searchProducts(q, limit),
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  });
}
