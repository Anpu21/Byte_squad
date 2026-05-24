import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosSaleById } from '../usePosSaleById';
import { posService } from '@/services/pos.service';
import { makeWrapper } from './test-utils';
import { saleFixture } from './sale-fixture';

vi.mock('@/services/pos.service', () => ({
    posService: {
        findSaleById: vi.fn(),
    },
}));

const findMock = vi.mocked(posService.findSaleById);

describe('usePosSaleById', () => {
    beforeEach(() => {
        findMock.mockReset();
    });

    it('stays idle while saleId is null so the typeahead does not issue spurious requests', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosSaleById(null), {
            wrapper: Wrapper,
        });
        expect(result.current.fetchStatus).toBe('idle');
        expect(findMock).not.toHaveBeenCalled();
    });

    it('fetches and returns the sale when a saleId is provided', async () => {
        findMock.mockResolvedValueOnce(saleFixture);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosSaleById('s1'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(findMock).toHaveBeenCalledWith('s1');
        expect(result.current.data).toBe(saleFixture);
    });
});
