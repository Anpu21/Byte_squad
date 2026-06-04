import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePosCreateSale } from '../usePosCreateSale';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICreateSalePayload } from '@/types';
import { makeWrapper } from './test-utils';
import { saleFixture } from './sale-fixture';

vi.mock('@/services/pos.service', () => ({
    posService: {
        createSale: vi.fn(),
    },
}));

const createMock = vi.mocked(posService.createSale);

const payload: ICreateSalePayload = {
    items: [
        {
            productId: 'p1',
            quantity: 1,
            unitPrice: 100,
        },
    ],
    payment: {
        paymentMethod: 'Cash',
        paymentAmount: 100,
        cashTendered: 100,
    },
};

describe('usePosCreateSale', () => {
    beforeEach(() => {
        createMock.mockReset();
    });

    it('forwards the idempotency key and invalidates inventory + recent sales on success', async () => {
        createMock.mockResolvedValueOnce(saleFixture);
        const { Wrapper, client } = makeWrapper();
        const spy = vi.spyOn(client, 'invalidateQueries');
        const { result } = renderHook(() => usePosCreateSale(), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current.mutateAsync({
                payload,
                idempotencyKey: 'idem-1',
            });
        });
        await waitFor(() =>
            expect(result.current.isSuccess).toBe(true),
        );
        expect(createMock).toHaveBeenCalledWith(payload, 'idem-1');
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.productInventoryAll(),
        });
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.recentSalesAll(),
        });
        // Dashboard + transactions surfaces must refresh after a sale so
        // KPIs and the transactions table reflect the new revenue without
        // requiring a manual reload.
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.cashierDashboard(),
        });
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.adminDashboard(),
        });
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.myTransactions(),
        });
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.allTransactions(),
        });
    });

    it('surfaces an error when the create-sale request fails', async () => {
        createMock.mockRejectedValueOnce(new Error('sale-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosCreateSale(), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current
                .mutateAsync({ payload })
                .catch(() => undefined);
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('sale-fail');
    });
});
