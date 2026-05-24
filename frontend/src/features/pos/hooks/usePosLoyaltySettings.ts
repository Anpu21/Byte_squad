import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Cashier-side loyalty rules read. The BE `GET /loyalty/settings`
 * endpoint is open to CUSTOMER / ADMIN / MANAGER / CASHIER roles, so
 * the same query key as the admin surface is safe to reuse. The
 * cashier surface uses the settings to estimate the earn amount in
 * the live bill preview before the sale is submitted.
 */
export function usePosLoyaltySettings() {
    return useQuery({
        queryKey: queryKeys.loyalty.settings(),
        queryFn: loyaltyService.getSettings,
        staleTime: 60_000,
    });
}
