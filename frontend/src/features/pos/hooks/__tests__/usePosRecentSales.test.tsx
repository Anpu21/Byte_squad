import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosRecentSales } from '../usePosRecentSales';
import { posService } from '@/services/pos.service';
import type { IRecentSaleRow } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getRecentSales: vi.fn(),
    },
}));

const recentMock = vi.mocked(posService.getRecentSales);

const row: IRecentSaleRow = {
    id: 's1',
    invoiceNumber: 'INV-1',
    transactionNumber: 'TX-1',
    total: 100,
    paidAmount: 100,
    balanceDue: 0,
    paymentStatus: 'Paid',
    saleType: 'Retail',
    status: 'Active',
    billPrinted: false,
    billPrintCount: 0,
    branchId: 'b1',
    customerUserId: null,
    customerName: null,
    createdAt: new Date().toISOString(),
};

describe('usePosRecentSales', () => {
    beforeEach(() => {
        recentMock.mockReset();
    });

    it('fetches and returns the recent-sales list', async () => {
        recentMock.mockResolvedValueOnce([row]);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosRecentSales(5), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([row]);
        expect(recentMock).toHaveBeenCalledWith(5);
    });

    it('surfaces an error when the recent-sales fetch rejects', async () => {
        recentMock.mockRejectedValueOnce(new Error('recent-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosRecentSales(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('recent-fail');
    });
});
