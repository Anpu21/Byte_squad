import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { loyaltyService } from '@/services/loyalty.service';

export function useLoyaltySettings() {
    const { isAuthenticated } = useAuth();
    return useQuery({
        queryKey: queryKeys.loyalty.settings(),
        queryFn: loyaltyService.getSettings,
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
}
