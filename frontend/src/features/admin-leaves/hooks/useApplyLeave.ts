import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IApplyLeavePayload, ILeave } from '@/types';

/**
 * Wraps `POST /hr/leaves`. Invalidates the entire `hr` family on
 * success so list + balance widgets refetch together.
 */
export function useApplyLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IApplyLeavePayload): Promise<ILeave> =>
            hrService.applyLeave(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
