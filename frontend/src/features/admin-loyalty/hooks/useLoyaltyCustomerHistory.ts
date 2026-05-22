import { useQuery } from '@tanstack/react-query';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';

interface UseLoyaltyCustomerHistoryArgs {
    userId: string | null;
    limit?: number;
    offset?: number;
}

export function useLoyaltyCustomerHistory({
    userId,
    limit = 20,
    offset = 0,
}: UseLoyaltyCustomerHistoryArgs) {
    return useQuery({
        queryKey: queryKeys.adminLoyalty.customerHistory(userId ?? '', {
            limit,
            offset,
        }),
        queryFn: () =>
            loyaltyAdminService.listCustomerHistory(userId!, { limit, offset }),
        enabled: Boolean(userId),
        staleTime: 15_000,
    });
}
