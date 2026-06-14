import { useQuery } from '@tanstack/react-query';
import {
    purchasesService,
    type IListGrnsQuery,
} from '@/services/purchases.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /purchases/grns` (managers are branch-pinned server-side). */
export function useGrns(args: IListGrnsQuery = {}) {
    return useQuery({
        queryKey: queryKeys.purchases.grns(args),
        queryFn: () => purchasesService.listGrns(args),
        staleTime: 15_000,
    });
}
