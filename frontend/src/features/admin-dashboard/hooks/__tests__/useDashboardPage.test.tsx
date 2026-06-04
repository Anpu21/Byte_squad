import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardPage } from '../useDashboardPage';
import { posService } from '@/services/pos.service';
import { UserRole } from '@/constants/enums';
import type { IAdminDashboard, IUser } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getAdminDashboard: vi.fn(),
    },
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
    ],
    topProducts: [],
    recentTransactions: [],
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

    it('returns admin dashboard data and derived KPI values', async () => {
        getAdminDashboardMock.mockResolvedValueOnce(dashboardFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useDashboardPage(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.data).toEqual(dashboardFixture));
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.todayRevenue).toBe(25_000);
        expect(result.current.todayCount).toBe(110);
        expect(result.current.avgOrderValue).toBe(227);
        expect(result.current.lowStockCount).toBe(14);
    });

    it('falls back to zeros while the query is loading', () => {
        getAdminDashboardMock.mockReturnValueOnce(new Promise(() => {}));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useDashboardPage(), {
            wrapper: Wrapper,
        });
        expect(result.current.isLoading).toBe(true);
        expect(result.current.todayRevenue).toBe(0);
        expect(result.current.todayCount).toBe(0);
        expect(result.current.lowStockCount).toBe(0);
    });
});
