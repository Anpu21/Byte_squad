import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCashierDashboardQuery } from '../useCashierDashboardQuery';
import { posService } from '@/services/pos.service';
import type { ICashierDashboard } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getCashierDashboard: vi.fn(),
    },
}));

const getCashierDashboardMock = vi.mocked(posService.getCashierDashboard);

const dashboardFixture: ICashierDashboard = {
    today: { totalSales: 800, transactionCount: 4, averageSale: 200 },
    week: { totalSales: 5_000, transactionCount: 25 },
    dailyBreakdown: [],
    recentTransactions: [],
};

describe('useCashierDashboardQuery', () => {
    beforeEach(() => {
        getCashierDashboardMock.mockReset();
    });

    it('resolves the cashier dashboard payload from the service', async () => {
        getCashierDashboardMock.mockResolvedValueOnce(dashboardFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useCashierDashboardQuery(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getCashierDashboardMock).toHaveBeenCalledTimes(1);
        expect(result.current.data).toEqual(dashboardFixture);
    });

    it('surfaces an error when the service rejects', async () => {
        getCashierDashboardMock.mockRejectedValueOnce(new Error('boom'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useCashierDashboardQuery(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('boom');
    });
});
