import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosProductInventory } from '../usePosProductInventory';
import { posService } from '@/services/pos.service';
import type { IInventoryQuantity } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getProductInventory: vi.fn(),
    },
}));

const invMock = vi.mocked(posService.getProductInventory);

const snapshot: IInventoryQuantity = {
    productId: 'p1',
    branchId: 'b1',
    branchName: 'Main',
    branchQty: 12,
    totalAcrossBranches: 50,
};

describe('usePosProductInventory', () => {
    beforeEach(() => {
        invMock.mockReset();
    });

    it('does not fire until a productId exists', () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => usePosProductInventory(undefined),
            { wrapper: Wrapper },
        );
        expect(result.current.fetchStatus).toBe('idle');
        expect(invMock).not.toHaveBeenCalled();
    });

    it('returns the branch + cross-branch snapshot on success', async () => {
        invMock.mockResolvedValueOnce(snapshot);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductInventory('p1'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(snapshot);
        expect(invMock).toHaveBeenCalledWith('p1');
    });

    it('surfaces an error when the inventory lookup fails', async () => {
        invMock.mockRejectedValueOnce(new Error('inv-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosProductInventory('p1'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('inv-fail');
    });
});
