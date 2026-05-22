import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import {
    formatDayShort,
    getTodayLabel,
} from '@/features/admin-dashboard/lib/format';
import type { ICashierDashboard } from '@/types';

const REFETCH_INTERVAL = 30_000;

export function useCashierDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery<ICashierDashboard>({
        queryKey: queryKeys.cashierDashboard(),
        queryFn: posService.getCashierDashboard,
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

    return {
        user,
        data,
        isLoading,
        sparkline,
        chartData,
        todayLabel: getTodayLabel(),
        goToPos: () => navigate(FRONTEND_ROUTES.POS),
    };
}
