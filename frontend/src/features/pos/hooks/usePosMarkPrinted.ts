import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Patch a sale to record that the bill was printed. The backend updates
 * `billPrinted`, increments `billPrintCount`, and stamps first/last print
 * dates. Invalidates recent-sales so the badge updates.
 */
export function usePosMarkPrinted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (saleId: string) => posService.markPrinted(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.recentSalesAll(),
      });
    },
  });
}
