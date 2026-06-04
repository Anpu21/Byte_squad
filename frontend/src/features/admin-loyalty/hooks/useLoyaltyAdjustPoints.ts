import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { getApiErrorMessage } from '@/lib/api-error';

interface AdjustPointsPayload {
    userId: string;
    points: number;
    reason: string;
}

export function useLoyaltyAdjustPoints() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, points, reason }: AdjustPointsPayload) => {
            await loyaltyAdminService.adjustPoints(userId, { points, reason });
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'customers'] });
            queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'customer-history', userId] });
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'dashboard'] });
            toast.success('Points adjusted successfully');
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to adjust points'));
        },
    });
}
