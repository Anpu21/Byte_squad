import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IAdminDashboard } from '@/types';
import { formatDayShort, getGreeting, getTodayLabel } from '../lib/format';

const REFETCH_INTERVAL = 30_000;

export function useDashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const { data, isLoading } = useQuery<IAdminDashboard>({
        queryKey: queryKeys.admin.dashboard(),
        queryFn: posService.getAdminDashboard,
        refetchInterval: REFETCH_INTERVAL,
    });

    const sparkline = useMemo(
        () =>
            (data?.dailyBreakdown ?? [])
                .slice(-10)
                .map((d) => Number(d.totalSales)),
        [data?.dailyBreakdown],
    );

    const chartData = useMemo(
        () =>
            (data?.dailyBreakdown ?? []).map((d) => ({
                name: formatDayShort(d.date),
                value: Number(d.totalSales),
            })),
        [data?.dailyBreakdown],
    );

    const todayRevenue = Number(data?.today.totalSales ?? 0);
    const todayCount = Number(data?.today.transactionCount ?? 0);
    const avgOrderValue = todayCount > 0 ? todayRevenue / todayCount : 0;
    const lowStockCount = Number(data?.stats.lowStockItems ?? 0);

    return {
        user,
        isAdmin,
        isLoading,
        data,
        sparkline,
        chartData,
        todayRevenue,
        todayCount,
        avgOrderValue,
        lowStockCount,
        greeting: getGreeting(),
        todayLabel: getTodayLabel(),
    };
}
