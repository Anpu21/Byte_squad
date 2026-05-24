import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosProductUnits } from '../usePosProductUnits';
import { posService } from '@/services/pos.service';
import type { IProductUnitRow } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        listProductUnits: vi.fn(),
    },
}));

const unitsMock = vi.mocked(posService.listProductUnits);

const unit: IProductUnitRow = {
    unitId: 'u1',
    unitName: 'kg',
    isBaseUnit: true,
    conversionToBase: 1,
    displayOrder: 0,
};

describe('usePosProductUnits', () => {
    beforeEach(() => {
        unitsMock.mockReset();
    });

    it('is disabled until a productId is supplied', () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductUnits(null), {
            wrapper: Wrapper,
        });
        expect(result.current.fetchStatus).toBe('idle');
        expect(unitsMock).not.toHaveBeenCalled();
    });

    it('returns the unit list when the productId is set', async () => {
        unitsMock.mockResolvedValueOnce([unit]);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductUnits('p1'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([unit]);
        expect(unitsMock).toHaveBeenCalledWith('p1');
    });

    it('surfaces an error when the service rejects', async () => {
        unitsMock.mockRejectedValueOnce(new Error('nope'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductUnits('p1'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('nope');
    });
});
