import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useAdminDashboardQuery } from '@/features/pos/hooks/useAdminDashboardQuery';
import { useLoyaltyDashboard } from '@/features/admin-loyalty/hooks/useLoyaltyDashboard';
import { useDashboardProfitLoss } from './useDashboardProfitLoss';
import { CHART_COLORS } from '@/components/charts/chart-palette';
import type {
    IAdminDashboard,
    ILoyaltyDashboardStats,
    IProfitLossData,
} from '@/types';
import { getTodayLabel } from '../lib/format';

interface UseDashboardPageResult {
    user: ReturnType<typeof useAuth>['user'];
    isAdmin: boolean;
    /** Gated on the primary dashboard query; P&L/loyalty fill in progressively. */
    isLoading: boolean;
    data: IAdminDashboard | undefined;
    profitLoss: IProfitLossData | undefined;
    loyalty: ILoyaltyDashboardStats | undefined;
    /** branchId → palette colour, shared by the trend lines and the branch donut. */
    branchColors: Record<string, string>;
    /** Daily revenue series (week) for the Total Revenue KPI sparkline. */
    revenueSpark: number[];
    /** Daily order-count series (week) for the Total Orders KPI sparkline. */
    ordersSpark: number[];
    todayLabel: string;
}

/**
 * Admin dashboard page model. Fans out to the three queries that back the
 * ShopPOS overview — the POS admin dashboard (sales/branch/payment/inventory
 * aggregations), the accounting P&L (profit + expense breakdown), and the
 * loyalty dashboard (member count) — and derives the cross-widget bits
 * (shared branch colours, KPI sparklines). Each widget does its own light
 * view-model derivation from the slice it receives.
 */
export function useDashboardPage(): UseDashboardPageResult {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const dashboard = useAdminDashboardQuery();
    const profitLoss = useDashboardProfitLoss();
    const loyalty = useLoyaltyDashboard('admin');

    const data = dashboard.data;

    const branchColors = useMemo<Record<string, string>>(() => {
        const branches = data?.dailyBreakdownByBranch.branches ?? [];
        const map: Record<string, string> = {};
        branches.forEach((b, i) => {
            map[b.branchId] = CHART_COLORS[i % CHART_COLORS.length];
        });
        return map;
    }, [data?.dailyBreakdownByBranch.branches]);

    const revenueSpark = useMemo(
        () => (data?.dailyBreakdown ?? []).map((d) => d.totalSales),
        [data?.dailyBreakdown],
    );
    const ordersSpark = useMemo(
        () => (data?.dailyBreakdown ?? []).map((d) => d.transactionCount),
        [data?.dailyBreakdown],
    );

    return {
        user,
        isAdmin,
        isLoading: dashboard.isLoading,
        data,
        profitLoss: profitLoss.data,
        loyalty: loyalty.data,
        branchColors,
        revenueSpark,
        ordersSpark,
        todayLabel: getTodayLabel(),
    };
}
