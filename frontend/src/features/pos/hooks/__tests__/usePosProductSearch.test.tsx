import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosProductSearch } from '../usePosProductSearch';
import { posService } from '@/services/pos.service';
import type { ISearchProductRow } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        searchProducts: vi.fn(),
    },
}));

const searchMock = vi.mocked(posService.searchProducts);

const row: ISearchProductRow = {
    productId: 'p1',
    productCode: 'PC',
    productName: 'Rice',
    productType: 'grocery',
    baseUnit: 'kg',
    status: true,
    costPrice: 100,
    retailPrice: 150,
    taxRate: 0,
    discountAllowed: true,
    imageUrl: null,
};

describe('usePosProductSearch', () => {
    beforeEach(() => {
        searchMock.mockReset();
    });

    it('skips fetching when the query is empty', () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductSearch('   '), {
            wrapper: Wrapper,
        });
        expect(result.current.fetchStatus).toBe('idle');
        expect(searchMock).not.toHaveBeenCalled();
    });

    it('returns the result list on a happy fetch', async () => {
        searchMock.mockResolvedValueOnce([row]);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductSearch('rice', 5), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([row]);
        expect(searchMock).toHaveBeenCalledWith('rice', 5);
    });

    it('surfaces an error when the service rejects', async () => {
        searchMock.mockRejectedValueOnce(new Error('boom'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductSearch('rice'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('boom');
    });
});
