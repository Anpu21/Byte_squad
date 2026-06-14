import { useQuery } from '@tanstack/react-query';
import { receivablesService } from '@/services/receivables.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /pos/receivables` — customers with balances or unpaid sales. */
export function useReceivables() {
    return useQuery({
        queryKey: queryKeys.receivables.list(),
        queryFn: receivablesService.list,
        staleTime: 15_000,
    });
}
