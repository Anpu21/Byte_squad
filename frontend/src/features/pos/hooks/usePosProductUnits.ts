import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Loads the sellable units for the given product so the cart row can show
 * a unit dropdown (e.g. kg / g / case). Disabled until a productId is set.
 */
export function usePosProductUnits(productId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.pos.productUnits(productId ?? ''),
    queryFn: () => posService.listProductUnits(productId as string),
    enabled: !!productId,
    staleTime: 60_000,
  });
}
