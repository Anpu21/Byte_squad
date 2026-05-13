import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { queryKeys } from '@/lib/queryKeys';
import { loyaltyService } from '@/services/loyalty.service';

export function useLoyaltySummary() {
    const { user, isAuthenticated } = useAuth();
    return useQuery({
        queryKey: queryKeys.loyalty.mine(),
        queryFn: loyaltyService.getMine,
        enabled: isAuthenticated && user?.role === UserRole.CUSTOMER,
        staleTime: 30_000,
    });
}
