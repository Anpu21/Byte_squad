import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    loyaltyAdminService,
    type UpdateLoyaltySettingsPayload,
} from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILoyaltySettings } from '@/types';

export function useLoyaltySettingsAdmin() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.loyalty.settings(),
        queryFn: loyaltyAdminService.getSettings,
        staleTime: 30_000,
    });

    const mutation = useMutation({
        mutationFn: (payload: UpdateLoyaltySettingsPayload) =>
            loyaltyAdminService.updateSettings(payload),
        onSuccess: (next: ILoyaltySettings) => {
            queryClient.setQueryData(queryKeys.loyalty.settings(), next);
            toast.success('Loyalty settings updated');
        },
        onError: () => {
            toast.error('Failed to update loyalty settings');
        },
    });

    return { query, mutation };
}
