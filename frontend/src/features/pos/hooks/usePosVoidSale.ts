import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

interface VoidSaleArgs {
  saleId: string;
  reason: string;
}

/**
 * Void a sale (ADMIN/MANAGER only). The backend reverses stock movements
 * and credit usage. Invalidate inventory + recent-sales so the cashier UI
 * sees the restored stock and the new Voided badge immediately.
 */
export function usePosVoidSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, reason }: VoidSaleArgs) =>
      posService.voidSale(saleId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.productInventoryAll(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.recentSalesAll(),
      });
    },
  });
}
