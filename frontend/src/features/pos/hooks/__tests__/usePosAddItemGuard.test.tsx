import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import { usePosAddItemGuard } from '../usePosAddItemGuard';
import { posService } from '@/services/pos.service';
import type { IInventoryQuantity } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getProductInventory: vi.fn(),
    },
}));
vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const invMock = vi.mocked(posService.getProductInventory);
const toastErrorMock = vi.mocked(toast.error);

const seed = {
    productId: 'p1',
    productCode: 'C1',
    productName: 'Milk 1L',
    productType: 'Dairy',
    baseUnit: 'unit',
    unitId: null,
    unitName: 'unit',
    unitPrice: 250,
    conversionFactor: 1,
    quantity: 1,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
};

function inventory(branchQty: number): IInventoryQuantity {
    return {
        productId: 'p1',
        branchId: 'b1',
        branchName: 'Main',
        branchQty,
        totalAcrossBranches: branchQty,
    };
}

describe('usePosAddItemGuard', () => {
    beforeEach(() => {
        invMock.mockReset();
        toastErrorMock.mockReset();
    });

    it('adds the item when the branch has stock', async () => {
        invMock.mockResolvedValueOnce(inventory(5));
        const addItem = vi.fn();
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosAddItemGuard(addItem), {
            wrapper: Wrapper,
        });

        result.current(seed);

        await waitFor(() => expect(addItem).toHaveBeenCalledTimes(1));
        expect(addItem).toHaveBeenCalledWith(seed);
        expect(invMock).toHaveBeenCalledWith('p1');
        expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it('blocks + toasts when the product is not stocked at the branch', async () => {
        invMock.mockResolvedValueOnce(inventory(0));
        const addItem = vi.fn();
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosAddItemGuard(addItem), {
            wrapper: Wrapper,
        });

        result.current(seed);

        await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
        expect(toastErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('Milk 1L'),
        );
        expect(addItem).not.toHaveBeenCalled();
    });

    it('fails open — adds the item when the stock lookup errors', async () => {
        invMock.mockRejectedValueOnce(new Error('inv-fail'));
        const addItem = vi.fn();
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosAddItemGuard(addItem), {
            wrapper: Wrapper,
        });

        result.current(seed);

        await waitFor(() => expect(addItem).toHaveBeenCalledTimes(1));
        expect(toastErrorMock).not.toHaveBeenCalled();
    });
});
