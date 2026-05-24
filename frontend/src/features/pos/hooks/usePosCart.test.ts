import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePosCart } from './usePosCart';

const seed = {
    productId: 'p-1',
    productCode: 'P001',
    productName: 'Test',
    productType: 'Regular',
    baseUnit: 'kg',
    unitId: 'u-1',
    unitName: 'kg',
    unitPrice: 100,
    conversionFactor: 1,
    quantity: 1,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
};

describe('usePosCart', () => {
    it('adds an item and computes totals', () => {
        const { result } = renderHook(() => usePosCart());
        act(() => result.current.addItem(seed));
        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].lineSubtotal).toBe(100);
        expect(result.current.cart[0].lineTotal).toBe(100);
        expect(result.current.cartTotal).toBe(100);
        expect(result.current.itemsSubtotal).toBe(100);
    });

    it('merges duplicate productId+unitId by stacking quantity', () => {
        const { result } = renderHook(() => usePosCart());
        act(() => result.current.addItem(seed));
        act(() => result.current.addItem(seed));
        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].quantity).toBe(2);
        expect(result.current.cartTotal).toBe(200);
    });

    it('keeps distinct rows when unitId differs for the same product', () => {
        const { result } = renderHook(() => usePosCart());
        act(() => result.current.addItem(seed));
        act(() =>
            result.current.addItem({ ...seed, unitId: 'u-2', unitName: 'g' }),
        );
        expect(result.current.cart).toHaveLength(2);
    });

    it('updateItem recomputes line totals when discount changes', () => {
        const { result } = renderHook(() => usePosCart());
        act(() => result.current.addItem(seed));
        const rowId = result.current.cart[0].rowId;
        act(() =>
            result.current.updateItem(rowId, { discountPercentage: 10 }),
        );
        expect(result.current.cart[0].lineSubtotal).toBe(90);
        expect(result.current.cart[0].lineDiscountAmount).toBe(10);
        expect(result.current.cart[0].lineTotal).toBe(90);
    });

    it('removeItem drops the row', () => {
        const { result } = renderHook(() => usePosCart());
        act(() => result.current.addItem(seed));
        const rowId = result.current.cart[0].rowId;
        act(() => result.current.removeItem(rowId));
        expect(result.current.cart).toHaveLength(0);
        expect(result.current.cartTotal).toBe(0);
    });

    it('clear empties the cart', () => {
        const { result } = renderHook(() => usePosCart());
        act(() => result.current.addItem(seed));
        act(() => result.current.addItem({ ...seed, unitId: 'u-2' }));
        act(() => result.current.clear());
        expect(result.current.cart).toHaveLength(0);
    });
});
