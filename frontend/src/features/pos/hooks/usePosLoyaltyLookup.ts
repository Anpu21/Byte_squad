import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';
import { isValidSriLankaPhone } from '@/lib/phone';
import type { ILoyaltyLookupResult } from '@/types';

/**
 * POS-side phone lookup for the loyalty card. Runs only once the typed phone is
 * a complete, valid Sri Lankan number (via `isValidSriLankaPhone`) — so we
 * never fire a doomed request or flash the enrol form mid-type. Returns `null`
 * data on a 404 (no member with that phone) and on a 400 (rejected as
 * unnormalizable), so the card switches cleanly to the inline enrol form
 * instead of getting stuck on a blocking error. Any other failure stays an
 * `isError` result for the caller to handle.
 *
 * `staleTime` is short so a mid-checkout enrol (see `usePosLoyaltyEnroll`)
 * flips the card miss->hit immediately without refetching every keystroke.
 */
export function usePosLoyaltyLookup(phone: string) {
    return useQuery<ILoyaltyLookupResult | null>({
        queryKey: queryKeys.loyalty.posLookup(phone),
        queryFn: async () => {
            try {
                return await loyaltyService.lookupByPhone(phone);
            } catch (err: unknown) {
                if (
                    axios.isAxiosError(err) &&
                    (err.response?.status === 404 ||
                        err.response?.status === 400)
                ) {
                    return null;
                }
                throw err;
            }
        },
        enabled: isValidSriLankaPhone(phone),
        staleTime: 10_000,
        retry: false,
    });
}
