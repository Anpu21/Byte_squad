import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /purchases/payments` (managers are branch-pinned). */
export function useSupplierPayments(
    args: { supplierId?: string; limit?: number; offset?: number } = {},
) {
    return useQuery({
        queryKey: queryKeys.purchases.payments(args),
        queryFn: () => purchasesService.listPayments(args),
        staleTime: 15_000,
    });
}
