import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILeave } from '@/types';

interface RejectLeaveArgs {
    id: string;
    rejectionReason: string;
}

/**
 * Wraps `PATCH /hr/leaves/:id/reject`. Manager/admin only. The BE
 * requires a 3+ char `rejectionReason`.
 */
export function useRejectLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, rejectionReason }: RejectLeaveArgs): Promise<ILeave> =>
            hrService.rejectLeave(id, rejectionReason),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
