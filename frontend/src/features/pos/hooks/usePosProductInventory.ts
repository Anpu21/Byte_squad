import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Branch + cross-branch inventory snapshot for a single product. Uses
 * `staleTime: 0` so an add-to-cart attempt always re-checks current stock
 * before allowing the line into the cart.
 */
export function usePosProductInventory(productId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.pos.productInventory(productId ?? ''),
    queryFn: () => posService.getProductInventory(productId as string),
    enabled: !!productId,
    staleTime: 0,
  });
}
