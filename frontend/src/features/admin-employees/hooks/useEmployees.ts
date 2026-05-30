import { useQuery } from '@tanstack/react-query';
import { hrService, type IListEmployeesQuery } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Wraps `GET /hr/employees`. Empty filter strings are stripped from
 * the wire payload so the BE WHERE clause stays cheap when the user
 * has only typed a partial filter row.
 */
export function useEmployees(args: IListEmployeesQuery) {
    const params: IListEmployeesQuery = {
        branchId: args.branchId || undefined,
        search: args.search?.trim() || undefined,
        status: args.status || undefined,
        limit: args.limit,
        offset: args.offset,
    };
    return useQuery({
        queryKey: queryKeys.hr.employees(params),
        queryFn: () => hrService.listEmployees(params),
        staleTime: 15_000,
    });
}
