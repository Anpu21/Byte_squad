import { useQuery } from '@tanstack/react-query';
import { hrService, type IListAttendanceQuery } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Wraps `GET /hr/attendance`. Empty optional filter strings are
 * stripped from the wire payload so the BE WHERE clause stays cheap
 * when no employee/branch chip is selected.
 *
 * `startDate` and `endDate` are required (ISO `YYYY-MM-DD`) — the
 * BE rejects the request without both.
 */
export function useAttendance(args: IListAttendanceQuery) {
    const params: IListAttendanceQuery = {
        branchId: args.branchId || undefined,
        employeeId: args.employeeId || undefined,
        startDate: args.startDate,
        endDate: args.endDate,
    };
    return useQuery({
        queryKey: queryKeys.hr.attendance(params),
        queryFn: () => hrService.listAttendance(params),
        staleTime: 15_000,
    });
}
