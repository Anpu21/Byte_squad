import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useCashierDashboardQuery } from '@/features/pos/hooks/useCashierDashboardQuery';
import type { ICashierDashboard, IDailyBreakdown } from '@/types';
import { getTodayLabel } from '@/features/admin-dashboard/lib/format';

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

interface UseCashierDashboardResult {
    user: ReturnType<typeof useAuth>['user'];
    data: ICashierDashboard | undefined;
    isLoading: boolean;
    sparkline: number[];
    chartData: ChartPoint[];
    todayLabel: string;
    goToPos: () => void;
}

/**
 * Cashier-dashboard page model. Wraps `useCashierDashboardQuery` and
 * derives the sparkline + chart series from the canonical daily breakdown.
 */
export function useCashierDashboard(): UseCashierDashboardResult {
    const { user } = useAuth();
    const navigate = useNavigate();
    const query = useCashierDashboardQuery();

    const sparkline = useMemo(
        () => buildSparkline(query.data?.dailyBreakdown),
        [query.data?.dailyBreakdown],
    );
    const chartData = useMemo(
        () => buildChartData(query.data?.dailyBreakdown),
        [query.data?.dailyBreakdown],
    );

    return {
        user,
        data: query.data,
        isLoading: query.isLoading,
        sparkline,
        chartData,
        todayLabel: getTodayLabel(),
        goToPos: () => navigate(FRONTEND_ROUTES.POS),
    };
}
