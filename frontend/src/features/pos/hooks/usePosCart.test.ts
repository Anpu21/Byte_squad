import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePosCart, type SchemeDiscountResolver } from './usePosCart';

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
    // usePosCart persists the cart to localStorage; clear it between cases so
    // state doesn't leak across tests (jsdom localStorage is shared per file).
    beforeEach(() => {
        localStorage.clear();
    });

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
            result.current.addItem({
                ...seed,
                unitId: 'u-2',
                unitName: '0.250 KG',
                conversionFactor: 0.25,
            }),
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

    describe('scheme resolver', () => {
        /** 10% on p-1 once the line reaches 3 units. */
        const slabResolver: SchemeDiscountResolver = ({
            productId,
            quantity,
        }) => (productId === 'p-1' && quantity >= 3 ? 10 : 0);

        it('applies the scheme discount to a fresh line', () => {
            const flat: SchemeDiscountResolver = () => 5;
            const { result } = renderHook(() => usePosCart(flat));
            act(() => result.current.addItem(seed));
            expect(result.current.cart[0].discountPercentage).toBe(5);
            expect(result.current.cart[0].lineTotal).toBe(95);
        });

        it('re-evaluates the qty slab when stacking a duplicate', () => {
            const { result } = renderHook(() => usePosCart(slabResolver));
            act(() => result.current.addItem(seed));
            act(() => result.current.addItem(seed));
            expect(result.current.cart[0].discountPercentage).toBe(0);
            act(() => result.current.addItem(seed));
            expect(result.current.cart[0].quantity).toBe(3);
            expect(result.current.cart[0].discountPercentage).toBe(10);
        });

        it('never overwrites a manual discount', () => {
            const { result } = renderHook(() => usePosCart(slabResolver));
            act(() => result.current.addItem({ ...seed, quantity: 2 }));
            const rowId = result.current.cart[0].rowId;
            act(() =>
                result.current.updateItem(rowId, { discountPercentage: 25 }),
            );
            act(() => result.current.addItem(seed));
            expect(result.current.cart[0].quantity).toBe(3);
            expect(result.current.cart[0].discountPercentage).toBe(25);
        });

        it('skips products where discount is not allowed', () => {
            const flat: SchemeDiscountResolver = () => 5;
            const { result } = renderHook(() => usePosCart(flat));
            act(() =>
                result.current.addItem({ ...seed, discountAllowed: false }),
            );
            expect(result.current.cart[0].discountPercentage).toBe(0);
        });
    });
});
