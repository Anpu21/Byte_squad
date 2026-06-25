import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardPage } from '../useDashboardPage';
import { posService } from '@/services/pos.service';
import { UserRole } from '@/constants/enums';
import { CHART_COLORS } from '@/components/charts/chart-palette';
import type { IAdminDashboard, IUser } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getAdminDashboard: vi.fn(),
    },
}));

// The page model fans out to the P&L + loyalty queries too; stub those hooks so
// this test stays focused on the POS-dashboard derivation (sparklines, colours).
vi.mock('../useDashboardProfitLoss', () => ({
    useDashboardProfitLoss: () => ({ data: undefined, isLoading: false }),
}));
vi.mock('@/features/admin-loyalty/hooks/useLoyaltyDashboard', () => ({
    useLoyaltyDashboard: () => ({
        data: { totalMembers: 1234 },
        isLoading: false,
    }),
}));

const adminFixture: IUser = {
    id: 'user-1',
    email: 'admin@ledgerpro.dev',
    firstName: 'Sam',
    lastName: 'Adams',
    avatarUrl: null,
    role: UserRole.ADMIN,
    branchId: null,
    phone: null,
    address: null,
    isFirstLogin: false,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: adminFixture,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
    }),
}));

const getAdminDashboardMock = vi.mocked(posService.getAdminDashboard);

const dashboardFixture: IAdminDashboard = {
    today: { totalSales: 25_000, transactionCount: 110, averageSale: 227 },
    week: { totalSales: 150_000, transactionCount: 620 },
    month: { totalRevenue: 700_000, transactionCount: 2_800 },
    stats: {
        activeProducts: 320,
        lowStockItems: 14,
        totalUsers: 45,
        totalBranches: 4,
    },
    dailyBreakdown: [
        { date: '2026-05-18', totalSales: 2000, transactionCount: 8 },
        { date: '2026-05-19', totalSales: 3200, transactionCount: 12 },
    ],
    topProducts: [],
    recentTransactions: [],
    salesByPaymentMethod: [],
    revenueByBranch: [],
    dailyBreakdownByBranch: {
        branches: [
            { branchId: 'b1', branchName: 'Main' },
            { branchId: 'b2', branchName: 'Downtown' },
        ],
        days: [],
    },
    inventorySummary: {
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        inventoryValue: 0,
    },
    pendingOrders: 3,
};

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { Wrapper, client };
}

describe('useDashboardPage', () => {
    beforeEach(() => {
        getAdminDashboardMock.mockReset();
    });

    it('exposes the dashboard data and derives sparklines + branch colours', async () => {
        getAdminDashboardMock.mockResolvedValueOnce(dashboardFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useDashboardPage(), {
            wrapper: Wrapper,
        });
        await waitFor(() =>
            expect(result.current.data).toEqual(dashboardFixture),
        );
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.loyalty?.totalMembers).toBe(1234);
        // Sparklines pivot the daily breakdown into flat numeric series.
        expect(result.current.revenueSpark).toEqual([2000, 3200]);
        expect(result.current.ordersSpark).toEqual([8, 12]);
        // Each branch gets a stable palette colour by index.
        expect(result.current.branchColors).toEqual({
            b1: CHART_COLORS[0],
            b2: CHART_COLORS[1],
        });
    });

    it('reports loading and empty derivations while the query is pending', () => {
        getAdminDashboardMock.mockReturnValueOnce(new Promise(() => {}));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useDashboardPage(), {
            wrapper: Wrapper,
        });
        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
        expect(result.current.revenueSpark).toEqual([]);
        expect(result.current.branchColors).toEqual({});
    });
});
