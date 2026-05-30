import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILeave } from '@/types';

/**
 * Wraps `PATCH /hr/leaves/:id/cancel`. Cashiers can self-cancel
 * Pending leaves; managers/admins can cancel any non-terminal leave.
 * The BE rolls back the annual-leave balance decrement if an
 * approved Annual leave is cancelled.
 */
export function useCancelLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string): Promise<ILeave> => hrService.cancelLeave(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
