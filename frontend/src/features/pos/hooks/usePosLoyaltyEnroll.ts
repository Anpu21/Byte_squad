import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILoyaltyLookupResult } from '@/types';

interface IUsePosLoyaltyEnrollArgs {
    /**
     * Phone string already typed into the loyalty card. We invalidate
     * the matching `posLookup` query on success so the card flips from
     * miss → hit without a manual refetch.
     */
    phone: string;
}

interface IEnrollMutationArgs {
    firstName: string;
    lastName?: string;
}

/**
 * Wraps the walk-in enrolment endpoint for the cashier card. On
 * success we both invalidate the pending lookup (so the same query
 * key transitions to the new result) and pre-seed the cache with the
 * returned wallet so the card can flip into the hit state without
 * waiting for a refetch.
 */
export function usePosLoyaltyEnroll({ phone }: IUsePosLoyaltyEnrollArgs) {
    const queryClient = useQueryClient();
    return useMutation<ILoyaltyLookupResult, Error, IEnrollMutationArgs>({
        mutationFn: ({ firstName, lastName }) =>
            loyaltyService.enrollWalkInCustomer({
                phone,
                firstName,
                lastName,
            }),
        onSuccess: (result) => {
            queryClient.setQueryData(
                queryKeys.loyalty.posLookup(phone),
                result,
            );
            queryClient.invalidateQueries({
                queryKey: queryKeys.loyalty.posLookup(phone),
            });
        },
    });
}
