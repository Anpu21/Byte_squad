import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { loyaltyAdminService } from '@/services/loyalty-admin.service';
import type { ILoyaltyDashboardStats } from '@/types';

async function fetchAdminDashboardStats(): Promise<ILoyaltyDashboardStats> {
    return loyaltyAdminService.getDashboardStats();
}

async function fetchManagerDashboardStats(): Promise<ILoyaltyDashboardStats> {
    const response = await api.get('/manager/loyalty/dashboard');
    return response.data.data;
}

export function useLoyaltyDashboard(role: 'admin' | 'manager') {
    return useQuery({
        queryKey: ['loyalty', 'dashboard', role],
        queryFn: role === 'admin' ? fetchAdminDashboardStats : fetchManagerDashboardStats,
    });
}
