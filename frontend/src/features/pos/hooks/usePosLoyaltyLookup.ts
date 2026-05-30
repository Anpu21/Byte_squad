import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILoyaltyLookupResult } from '@/types';

/**
 * Minimum digit count that triggers a lookup. The backend regex accepts
 * 7-20 digits — we match the lower bound so the cashier can still tab
 * through a partially-typed number without firing a request.
 */
const MIN_LOOKUP_DIGITS = 7;

/**
 * True when `phone` has enough numeric content for the backend to
 * accept it. We ignore formatting characters (spaces, parens, dashes,
 * leading `+`) because the cashier may paste raw card-printed numbers.
 */
function hasEnoughDigits(phone: string): boolean {
    return phone.replace(/\D/g, '').length >= MIN_LOOKUP_DIGITS;
}

/**
 * POS-side phone lookup for the loyalty card. Returns `null` data on
 * 404 (no loyalty owner with that phone) so the card can switch to the
 * inline enrol form instead of surfacing an error toast. Every other
 * failure surfaces as an `isError` result for the caller to handle.
 *
 * `staleTime` is set short — the cashier may enrol mid-checkout and we
 * want the post-enrol invalidation (in `usePosLoyaltyEnroll`) to take
 * effect immediately without refetching every keystroke.
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
                    err.response?.status === 404
                ) {
                    return null;
                }
                throw err;
            }
        },
        enabled: hasEnoughDigits(phone),
        staleTime: 10_000,
        retry: false,
    });
}
