import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILeave } from '@/types';

/**
 * Wraps `PATCH /hr/leaves/:id/approve`. Manager/admin only.
 * Invalidates the hr family so the leave row + employee balance
 * refetch together.
 */
export function useApproveLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string): Promise<ILeave> => hrService.approveLeave(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
