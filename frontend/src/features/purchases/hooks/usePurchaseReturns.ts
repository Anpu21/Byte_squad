import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** Debit notes raised against one GRN. */
export function usePurchaseReturns(grnId: string | null) {
    return useQuery({
        queryKey: queryKeys.purchases.returnsForGrn(grnId ?? ''),
        queryFn: () => purchasesService.listReturnsForGrn(grnId ?? ''),
        enabled: grnId !== null,
    });
}
