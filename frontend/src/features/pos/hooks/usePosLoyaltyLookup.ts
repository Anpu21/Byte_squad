import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ILoyaltyLookupResult } from '@/types';

/**
 * True once the typed phone is a complete Sri Lankan number the backend can
 * normalize (`0XXXXXXXXX` or `94XXXXXXXXX`). Gating the lookup on completeness
 * stops us firing doomed requests — and flashing the enrol form — while the
 * cashier is still mid-type.
 */
function isLookupReady(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return (
        (digits.length === 10 && digits.startsWith('0')) ||
        (digits.length === 11 && digits.startsWith('94'))
    );
}

/**
 * POS-side phone lookup for the loyalty card. Returns `null` data when no
 * loyalty owner matches (HTTP 404) — and also when the number is rejected as
 * unnormalizable (HTTP 400) — so the card switches cleanly to the inline enrol
 * form instead of getting stuck on a blocking error. Any other failure stays an
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
        enabled: isLookupReady(phone),
        staleTime: 10_000,
        retry: false,
    });
}
