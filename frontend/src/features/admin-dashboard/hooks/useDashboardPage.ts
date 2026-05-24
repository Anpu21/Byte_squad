import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useAdminDashboardQuery } from '@/features/pos/hooks/useAdminDashboardQuery';
import type { IAdminDashboard, IDailyBreakdown } from '@/types';
import { getGreeting, getTodayLabel } from '../lib/format';

interface ChartPoint {
    name: string;
    value: number;
}

function buildSparkline(breakdown: IDailyBreakdown[] | undefined): number[] {
    if (!breakdown || breakdown.length === 0) return [];
    return breakdown.map((day) => day.totalSales);
}

function buildChartData(breakdown: IDailyBreakdown[] | undefined): ChartPoint[] {
    if (!breakdown || breakdown.length === 0) return [];
    return breakdown.map((day) => ({
        name: new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', {
            weekday: 'short',
        }),
        value: day.totalSales,
    }));
}

interface UseDashboardPageResult {
    user: ReturnType<typeof useAuth>['user'];
    isAdmin: boolean;
    isLoading: boolean;
    data: IAdminDashboard | undefined;
    sparkline: number[];
    chartData: ChartPoint[];
    todayRevenue: number;
    todayCount: number;
    avgOrderValue: number;
    lowStockCount: number;
    greeting: string;
    todayLabel: string;
}

/**
 * Admin/manager dashboard page model. Wraps `useAdminDashboardQuery` and
 * derives sparkline + chart series from the canonical daily breakdown.
 * Branch scoping is handled server-side based on the JWT, so non-admins
 * naturally see only their branch.
 */
export function useDashboardPage(): UseDashboardPageResult {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const query = useAdminDashboardQuery();

    const sparkline = useMemo(
        () => buildSparkline(query.data?.dailyBreakdown),
        [query.data?.dailyBreakdown],
    );
    const chartData = useMemo(
        () => buildChartData(query.data?.dailyBreakdown),
        [query.data?.dailyBreakdown],
    );

    const todayRevenue = query.data?.today.totalSales ?? 0;
    const todayCount = query.data?.today.transactionCount ?? 0;
    const avgOrderValue = query.data?.today.averageSale ?? 0;
    const lowStockCount = query.data?.stats.lowStockItems ?? 0;

    return {
        user,
        isAdmin,
        isLoading: query.isLoading,
        data: query.data,
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
