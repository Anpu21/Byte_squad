import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /purchases/reports/ageing` — unpaid remainders by overdue age. */
export function usePayablesAgeing() {
    return useQuery({
        queryKey: queryKeys.purchases.ageing(),
        queryFn: purchasesService.getAgeing,
        staleTime: 15_000,
    });
}
