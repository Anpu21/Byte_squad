import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { ISale } from '@/types';
import { getGreeting, getTodayLabel } from '../lib/format';

/**
 * Admin-dashboard page model.
 *
 * Phase 1 of the Shanel POS port deletes the legacy `posService`. Until
 * Phase 7 rewires this dashboard against the new POS read endpoints we
 * return an empty data envelope so the dashboard renders the zero state.
 *
 * TODO Phase 7: rewire to new pos.service / dashboard endpoint.
 */
export function useDashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    // Stable empty data — mirrors the legacy IAdminDashboard shape just enough
    // for downstream components to render the zero state without crashing.
    const data = {
        today: { totalSales: 0, transactionCount: 0 },
        month: { totalSales: 0, transactionCount: 0 },
        stats: { lowStockItems: 0, activeProducts: 0 },
        topProducts: [] as { productId: string; productName: string; totalQuantity: number; totalRevenue: number }[],
        recentTransactions: [] as ISale[],
    };

    return {
        user,
        isAdmin,
        isLoading: false,
        data,
        sparkline: [] as number[],
        chartData: [] as { name: string; value: number }[],
        todayRevenue: 0,
        todayCount: 0,
        avgOrderValue: 0,
        lowStockCount: 0,
        greeting: getGreeting(),
        todayLabel: getTodayLabel(),
    };
}
