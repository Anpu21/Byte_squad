import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePosVoidSale } from '../usePosVoidSale';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import { makeWrapper } from './test-utils';
import { saleFixture } from './sale-fixture';

vi.mock('@/services/pos.service', () => ({
    posService: {
        voidSale: vi.fn(),
    },
}));

const voidMock = vi.mocked(posService.voidSale);

describe('usePosVoidSale', () => {
    beforeEach(() => {
        voidMock.mockReset();
    });

    it('invalidates inventory + recent-sales after a successful void', async () => {
        voidMock.mockResolvedValueOnce({
            ...saleFixture,
            status: 'Voided',
            voidedReason: 'wrong customer',
            voidedAt: new Date().toISOString(),
        });
        const { Wrapper, client } = makeWrapper();
        const spy = vi.spyOn(client, 'invalidateQueries');
        const { result } = renderHook(() => usePosVoidSale(), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current.mutateAsync({
                saleId: 's1',
                reason: 'wrong customer',
            });
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(voidMock).toHaveBeenCalledWith('s1', 'wrong customer');
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.productInventoryAll(),
        });
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.recentSalesAll(),
        });
    });

    it('surfaces an error when the void rejects', async () => {
        voidMock.mockRejectedValueOnce(new Error('void-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosVoidSale(), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current
                .mutateAsync({ saleId: 's1', reason: 'oops' })
                .catch(() => undefined);
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('void-fail');
    });
});
