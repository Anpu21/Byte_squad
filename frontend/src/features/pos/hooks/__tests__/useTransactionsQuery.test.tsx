import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTransactionsQuery } from '../useTransactionsQuery';
import { posService } from '@/services/pos.service';
import type { ICashierTransactionsSummary } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getMyTransactions: vi.fn(),
        getAllTransactions: vi.fn(),
    },
}));

const getMineMock = vi.mocked(posService.getMyTransactions);
const getAllMock = vi.mocked(posService.getAllTransactions);

const summaryFixture: ICashierTransactionsSummary = {
    scope: 'branch',
    today: { totalSales: 500, transactionCount: 2 },
    month: { totalSales: 12_000, transactionCount: 60 },
    year: { totalSales: 144_000, transactionCount: 720 },
    recentTransactions: [],
};

describe('useTransactionsQuery', () => {
    beforeEach(() => {
        getMineMock.mockReset();
        getAllMock.mockReset();
    });

    it('routes scope "mine" to getMyTransactions', async () => {
        getMineMock.mockResolvedValueOnce(summaryFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => useTransactionsQuery({ scope: 'mine' }),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getMineMock).toHaveBeenCalledTimes(1);
        expect(getAllMock).not.toHaveBeenCalled();
        expect(result.current.data).toEqual(summaryFixture);
    });

    it('routes scope "all" to getAllTransactions', async () => {
        const systemSummary = { ...summaryFixture, scope: 'system' as const };
        getAllMock.mockResolvedValueOnce(systemSummary);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => useTransactionsQuery({ scope: 'all' }),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getAllMock).toHaveBeenCalledTimes(1);
        expect(getMineMock).not.toHaveBeenCalled();
        expect(result.current.data?.scope).toBe('system');
    });

    it('does not fire when enabled=false', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => useTransactionsQuery({ scope: 'all', enabled: false }),
            { wrapper: Wrapper },
        );
        // give the query a moment to (not) run
        await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
        expect(getAllMock).not.toHaveBeenCalled();
        expect(getMineMock).not.toHaveBeenCalled();
    });
});
