import { useQuery } from '@tanstack/react-query';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';

interface UseLoyaltyCustomersArgs {
    search?: string;
    limit: number;
    offset: number;
}

export function useLoyaltyCustomers(args: UseLoyaltyCustomersArgs) {
    return useQuery({
        queryKey: queryKeys.adminLoyalty.customers(args),
        queryFn: () =>
            loyaltyAdminService.listCustomers({
                search: args.search,
                limit: args.limit,
                offset: args.offset,
            }),
        staleTime: 15_000,
    });
}
