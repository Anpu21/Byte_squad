import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminDashboardQuery } from '../useAdminDashboardQuery';
import { posService } from '@/services/pos.service';
import type { IAdminDashboard } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getAdminDashboard: vi.fn(),
    },
}));

const getAdminDashboardMock = vi.mocked(posService.getAdminDashboard);

const dashboardFixture: IAdminDashboard = {
    today: { totalSales: 10_000, transactionCount: 50, averageSale: 200 },
    week: { totalSales: 60_000, transactionCount: 300 },
    month: { totalRevenue: 250_000, transactionCount: 1_250 },
    stats: {
        activeProducts: 100,
        lowStockItems: 5,
        totalUsers: 12,
        totalBranches: 3,
    },
    dailyBreakdown: [],
    topProducts: [],
    recentTransactions: [],
    salesByPaymentMethod: [],
    revenueByBranch: [],
    dailyBreakdownByBranch: { branches: [], days: [] },
    inventorySummary: {
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        inventoryValue: 0,
    },
    pendingOrders: 0,
};

describe('useAdminDashboardQuery', () => {
    beforeEach(() => {
        getAdminDashboardMock.mockReset();
    });

    it('resolves the admin dashboard payload from the service', async () => {
        getAdminDashboardMock.mockResolvedValueOnce(dashboardFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useAdminDashboardQuery(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getAdminDashboardMock).toHaveBeenCalledTimes(1);
        expect(result.current.data).toEqual(dashboardFixture);
    });
});
