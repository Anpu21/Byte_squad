import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';

interface IEnrollLoyaltyMemberArgs {
    phone: string;
    firstName: string;
    lastName?: string;
}

/**
 * Enrol a walk-in loyalty member from the cashier browse page. On success
 * the branch-members list is invalidated (by prefix, across every search)
 * so the new member — whose home branch is now set server-side — appears
 * immediately without a manual refresh.
 */
export function useEnrollLoyaltyMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: IEnrollLoyaltyMemberArgs) =>
            loyaltyService.enrollWalkInCustomer(args),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['loyalty', 'branch-members'],
            });
        },
    });
}
