import { useQuery } from '@tanstack/react-query';
import { hrService, type IListPayrollQuery } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Wraps `GET /hr/payroll`. Empty optional fields are stripped so the
 * BE WHERE clause stays cheap when no chip is selected.
 */
export function usePayroll(args: IListPayrollQuery = {}) {
    const params: IListPayrollQuery = {
        branchId: args.branchId || undefined,
        employeeId: args.employeeId || undefined,
        month: args.month,
        year: args.year,
        status: args.status,
        limit: args.limit,
        offset: args.offset,
    };
    return useQuery({
        queryKey: queryKeys.hr.payroll(params),
        queryFn: () => hrService.listPayroll(params),
        staleTime: 15_000,
    });
}
