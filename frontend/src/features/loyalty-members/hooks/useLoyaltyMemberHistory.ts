import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';

const HISTORY_PARAMS = { limit: 50, offset: 0 } as const;

/**
 * One branch member's points ledger, opened from the members table. Keyed
 * on the list row id (a user id or a walk-in id); disabled until a row is
 * selected so the modal doesn't fetch while closed.
 */
export function useLoyaltyMemberHistory(id: string | null) {
    return useQuery({
        queryKey: queryKeys.loyalty.memberHistory(id ?? '', HISTORY_PARAMS),
        queryFn: () => loyaltyService.memberHistory(id as string, HISTORY_PARAMS),
        enabled: id !== null,
        staleTime: 10_000,
    });
}
