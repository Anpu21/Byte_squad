import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCashierDashboard } from '../useCashierDashboard';
import { posService } from '@/services/pos.service';
import { UserRole } from '@/constants/enums';
import type { ICashierDashboard, IUser } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getCashierDashboard: vi.fn(),
    },
}));

const cashierFixture: IUser = {
    id: 'user-1',
    email: 'cashier@ledgerpro.dev',
    firstName: 'Alex',
    lastName: 'Pereira',
    avatarUrl: null,
    role: UserRole.CASHIER,
    branchId: 'branch-1',
    phone: null,
    address: null,
    isFirstLogin: false,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: cashierFixture,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
    }),
}));

const getCashierDashboardMock = vi.mocked(posService.getCashierDashboard);

const dashboardFixture: ICashierDashboard = {
    today: { totalSales: 1500, transactionCount: 7, averageSale: 214 },
    week: { totalSales: 10_000, transactionCount: 42 },
    dailyBreakdown: [
        { date: '2026-05-18', totalSales: 1200, transactionCount: 5 },
        { date: '2026-05-19', totalSales: 1800, transactionCount: 6 },
    ],
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
        <QueryClientProvider client={client}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    );
    return { Wrapper, client };
}

describe('useCashierDashboard', () => {
    beforeEach(() => {
        getCashierDashboardMock.mockReset();
    });

    it('exposes the cashier dashboard data once the query resolves', async () => {
        getCashierDashboardMock.mockResolvedValueOnce(dashboardFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useCashierDashboard(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.data).toEqual(dashboardFixture));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.user?.id).toBe('user-1');
    });

    it('derives sparkline and chart data from dailyBreakdown', async () => {
        getCashierDashboardMock.mockResolvedValueOnce(dashboardFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useCashierDashboard(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.sparkline.length).toBe(2));
        expect(result.current.sparkline).toEqual([1200, 1800]);
        expect(result.current.chartData.map((p) => p.value)).toEqual([
            1200, 1800,
        ]);
    });
});
