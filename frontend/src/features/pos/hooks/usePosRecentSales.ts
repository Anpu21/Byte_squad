import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Drives the cashier's recent-sales sidebar. Polls every 30 seconds so
 * other tills' sales appear without manual reload; mutations on the same
 * client invalidate this key explicitly for immediate feedback.
 */
export function usePosRecentSales(limit = 10) {
  return useQuery({
    queryKey: queryKeys.pos.recentSales(limit),
    queryFn: () => posService.getRecentSales(limit),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
