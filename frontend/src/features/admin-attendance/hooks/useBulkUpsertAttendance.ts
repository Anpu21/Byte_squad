import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IAttendance, IBulkAttendancePayload } from '@/types';

/**
 * Wraps `POST /hr/attendance/bulk`. Invalidates the entire `hr`
 * family on success so the grid + any employee-profile attendance
 * widgets refetch in lockstep. The BE upserts the entire batch in a
 * single transaction, so on success every row in the payload is
 * already reflected in the DB.
 */
export function useBulkUpsertAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IBulkAttendancePayload): Promise<IAttendance[]> =>
            hrService.bulkUpsertAttendance(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
