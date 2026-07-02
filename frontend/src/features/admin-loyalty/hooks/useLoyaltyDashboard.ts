import { useQuery } from '@tanstack/react-query';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import { queryKeys } from '@/lib/queryKeys';

export function useLoyaltyDashboard(role: 'admin' | 'manager') {
    return useQuery({
        queryKey: queryKeys.adminLoyalty.dashboard(role),
        queryFn: () => loyaltyAdminService.getDashboardStats(role),
    });
}
