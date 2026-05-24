import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { ISale } from '@/types';
import { getTodayLabel } from '@/features/admin-dashboard/lib/format';

/**
 * Cashier-dashboard page model.
 *
 * Phase 1 of the Shanel POS port deletes the legacy `posService`. Until
 * Phase 7 rewires this dashboard against the new cashier read endpoint we
 * return an empty data envelope so the dashboard renders the zero state.
 *
 * TODO Phase 7: rewire to new pos.service / cashier-dashboard endpoint.
 */
export function useCashierDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Stable empty data — mirrors the legacy ICashierDashboard shape just
    // enough for downstream components to render the zero state.
    const data = {
        today: { totalSales: 0, transactionCount: 0, averageSale: 0 },
        week: { totalSales: 0, transactionCount: 0 },
        recentTransactions: [] as ISale[],
    };

    return {
        user,
        data,
        isLoading: false,
        sparkline: [] as number[],
        chartData: [] as { name: string; value: number }[],
        todayLabel: getTodayLabel(),
        goToPos: () => navigate(FRONTEND_ROUTES.POS),
    };
}
