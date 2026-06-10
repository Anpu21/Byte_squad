import { useQuery } from '@tanstack/react-query';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /purchases/grns/:id` — header + lines for the detail modal. */
export function useGrn(id: string | null) {
    return useQuery({
        queryKey: queryKeys.purchases.grn(id ?? ''),
        queryFn: () => purchasesService.getGrn(id ?? ''),
        enabled: id !== null,
    });
}
