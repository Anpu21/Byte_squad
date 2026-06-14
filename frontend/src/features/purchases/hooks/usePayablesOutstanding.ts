import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /purchases/reports/outstanding` — supplier-level totals. */
export function usePayablesOutstanding() {
    return useQuery({
        queryKey: queryKeys.purchases.outstanding(),
        queryFn: purchasesService.getOutstanding,
        staleTime: 15_000,
    });
}
