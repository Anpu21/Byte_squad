import { useQuery } from '@tanstack/react-query';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';

interface UseLoyaltyCustomersArgs {
    role: 'admin' | 'manager';
    search?: string;
    branchId?: string;
    activeSince?: string;
    minPoints?: number;
    maxPoints?: number;
    limit: number;
    offset: number;
}

/**
 * Wraps GET /admin/loyalty/customers. Omits empty string / undefined
 * filter params from the wire payload so the BE WHERE clause stays
 * cheap when the cashier has only typed a partial filter row.
 */
export function useLoyaltyCustomers(args: UseLoyaltyCustomersArgs) {
    const params = {
        search: args.search?.trim() || undefined,
        branchId: args.branchId || undefined,
        activeSince: args.activeSince || undefined,
        minPoints: Number.isFinite(args.minPoints) ? args.minPoints : undefined,
        maxPoints: Number.isFinite(args.maxPoints) ? args.maxPoints : undefined,
        limit: args.limit,
        offset: args.offset,
    };
    return useQuery({
        queryKey: [...queryKeys.adminLoyalty.customers(params), args.role],
        queryFn: () => loyaltyAdminService.listCustomers(args.role, params),
        staleTime: 15_000,
    });
}
