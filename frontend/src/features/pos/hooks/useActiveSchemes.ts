import { useQuery } from '@tanstack/react-query';
import { discountSchemesService } from '@/services/discount-schemes.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Today's active discount schemes for the acting cashier's branch.
 * Cached for a minute and refreshed in the background — scheme edits
 * land on the till within a few minutes without manual refreshes.
 */
export function useActiveSchemes(enabled = true) {
    return useQuery({
        queryKey: queryKeys.pos.activeSchemes(),
        queryFn: discountSchemesService.active,
        staleTime: 60_000,
        refetchInterval: 5 * 60_000,
        enabled,
    });
}
