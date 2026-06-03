import { useQuery } from '@tanstack/react-query';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';

interface UseLoyaltyCustomerHistoryArgs {
    role: 'admin' | 'manager';
    userId: string | null;
    limit?: number;
    offset?: number;
}

export function useLoyaltyCustomerHistory({
    role,
    userId,
    limit = 20,
    offset = 0,
}: UseLoyaltyCustomerHistoryArgs) {
    return useQuery({
        queryKey: [...queryKeys.adminLoyalty.customerHistory(userId ?? '', { limit, offset }), role],
        queryFn: () =>
            loyaltyAdminService.listCustomerHistory(role, userId!, { limit, offset }),
        enabled: Boolean(userId),
        staleTime: 15_000,
    });
}
