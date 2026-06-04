import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IAttendance } from '@/types';

/**
 * Wraps `POST /hr/attendance/check-in`. Stateless on the FE — the
 * BE rejects double check-ins, so the widget only needs to consume
 * the success/error and surface it. We invalidate `hr` family so
 * any manager grid open in another tab refreshes immediately.
 */
export function useCheckInSelf() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (): Promise<IAttendance> => hrService.checkInSelf(),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
