import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Preview the next invoice number the server will issue on checkout, so
 * the bill template can show it before the cashier presses Confirm. The
 * value is purely advisory — the actual number is assigned by the server.
 */
export function usePosInvoiceNumber() {
  return useQuery({
    queryKey: queryKeys.pos.invoiceNumber(),
    queryFn: () => posService.previewInvoiceNumber(),
    staleTime: 60_000,
  });
}
