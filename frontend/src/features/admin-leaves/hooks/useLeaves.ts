import { useQuery } from '@tanstack/react-query';
import { hrService, type IListLeavesQuery } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Wraps `GET /hr/leaves`. Empty optional filter strings are stripped
 * so the BE WHERE clause stays cheap when no chip is selected.
 * Cashiers are server-pinned to their own employee — passing a
 * different `employeeId` from a cashier session is a no-op.
 */
export function useLeaves(args: IListLeavesQuery = {}) {
    const params: IListLeavesQuery = {
        branchId: args.branchId || undefined,
        employeeId: args.employeeId || undefined,
        status: args.status,
        startDate: args.startDate || undefined,
        endDate: args.endDate || undefined,
        limit: args.limit,
        offset: args.offset,
    };
    return useQuery({
        queryKey: queryKeys.hr.leaves(params),
        queryFn: () => hrService.listLeaves(params),
        staleTime: 15_000,
    });
}
