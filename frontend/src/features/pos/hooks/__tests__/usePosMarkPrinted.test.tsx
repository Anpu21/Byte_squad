import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePosMarkPrinted } from '../usePosMarkPrinted';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import { makeWrapper } from './test-utils';
import { saleFixture } from './sale-fixture';

vi.mock('@/services/pos.service', () => ({
    posService: {
        markPrinted: vi.fn(),
    },
}));

const printMock = vi.mocked(posService.markPrinted);

describe('usePosMarkPrinted', () => {
    beforeEach(() => {
        printMock.mockReset();
    });

    it('invalidates the recent-sales namespace on success', async () => {
        printMock.mockResolvedValueOnce({
            ...saleFixture,
            billPrinted: true,
            billPrintCount: 1,
        });
        const { Wrapper, client } = makeWrapper();
        const spy = vi.spyOn(client, 'invalidateQueries');
        const { result } = renderHook(() => usePosMarkPrinted(), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current.mutateAsync('s1');
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(printMock).toHaveBeenCalledWith('s1');
        expect(spy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.recentSalesAll(),
        });
    });

    it('surfaces an error when the print mutation rejects', async () => {
        printMock.mockRejectedValueOnce(new Error('print-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosMarkPrinted(), {
            wrapper: Wrapper,
        });
        await act(async () => {
            await result.current
                .mutateAsync('s1')
                .catch(() => undefined);
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('print-fail');
    });
});
