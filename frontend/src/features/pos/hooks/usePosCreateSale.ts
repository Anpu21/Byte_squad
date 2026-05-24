import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICreateSalePayload } from '@/types';

interface CreateSaleArgs {
  payload: ICreateSalePayload;
  idempotencyKey?: string;
}

/**
 * Submit a checkout. On success, invalidate every product-inventory and
 * recent-sales query so the cashier UI re-reads stock and the sidebar
 * reflects the new sale. The caller may pass an `X-Idempotency-Key` so a
 * double-click does not produce two sales.
 */
export function usePosCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: CreateSaleArgs) =>
      posService.createSale(payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.productInventoryAll(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.recentSalesAll(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.invoiceNumber(),
      });
      // Dashboard + transactions surfaces depend on the sale stream; a new
      // sale must refresh every visible KPI/table without manual reload.
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.cashierDashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.adminDashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.myTransactions(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.allTransactions(),
      });
    },
  });
}
