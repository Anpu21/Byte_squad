import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IAttendance } from '@/types';

/**
 * Wraps `POST /hr/attendance/check-out`. Stateless on the FE — the
 * BE rejects when no matching check-in exists, so the widget just
 * relays the server response. Invalidates the `hr` cache family so
 * the manager grid picks up the close-out without a manual refresh.
 */
export function useCheckOutSelf() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (): Promise<IAttendance> => hrService.checkOutSelf(),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
