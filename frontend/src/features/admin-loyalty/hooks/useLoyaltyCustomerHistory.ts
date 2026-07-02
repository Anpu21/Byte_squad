import { useQuery } from '@tanstack/react-query';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';

interface UseLoyaltyCustomerHistoryArgs {
    /** Directory row id — a userId (registered) or loyaltyCustomerId (walk-in). */
    memberId: string | null;
    limit?: number;
    offset?: number;
}

export function useLoyaltyCustomerHistory({
    memberId,
    limit = 20,
    offset = 0,
}: UseLoyaltyCustomerHistoryArgs) {
    return useQuery({
        queryKey: queryKeys.adminLoyalty.customerHistory(memberId ?? '', {
            limit,
            offset,
        }),
        queryFn: () =>
            loyaltyAdminService.listCustomerHistory(memberId!, {
                limit,
                offset,
            }),
        enabled: Boolean(memberId),
        staleTime: 15_000,
    });
}
