import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Branch-scoped loyalty members for the cashier browse page. Loads a
 * generous page (the endpoint caps at 100) which the page then filters and
 * paginates client-side — mirroring the store-credit accounts list. The
 * backend pins non-admins to their own branch and returns members homed
 * there OR with branch ledger activity.
 */
const BRANCH_MEMBERS_PARAMS = { limit: 100 } as const;

export function useLoyaltyBranchMembers() {
    return useQuery({
        queryKey: queryKeys.loyalty.branchMembers(BRANCH_MEMBERS_PARAMS),
        queryFn: () => loyaltyService.listBranchCustomers(BRANCH_MEMBERS_PARAMS),
        staleTime: 15_000,
    });
}
