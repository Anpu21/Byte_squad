import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { getApiErrorMessage } from '@/lib/api-error';

interface AdjustPointsPayload {
    role: 'admin' | 'manager';
    /** Directory row id — a userId (registered) or loyaltyCustomerId (walk-in). */
    memberId: string;
    points: number;
    reason: string;
}

export function useLoyaltyAdjustPoints() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            role,
            memberId,
            points,
            reason,
        }: AdjustPointsPayload) => {
            await loyaltyAdminService.adjustPoints(role, memberId, {
                points,
                reason,
            });
        },
        onSuccess: (_, { memberId }) => {
            queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'customers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'customer-history', memberId] });
            queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'dashboard'] });
            toast.success('Points adjusted successfully');
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to adjust points'));
        },
    });
}
