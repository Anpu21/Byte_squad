import { describe, it, expect } from 'vitest';
import reducer, { addToCart, setQuantity } from './shopCartSlice';

const base = {
    productId: 'p1',
    branchId: 'b1',
    branchName: 'Main',
    name: 'Sugar',
    sellingPrice: 250,
    imageUrl: null,
    unitId: null,
    unitLabel: 'kg',
    baseUnit: 'kg',
};

const empty = reducer(undefined, { type: '@@INIT' });

describe('shopCartSlice', () => {
    it('adds a line carrying its base unit and a fractional quantity', () => {
        const state = reducer(empty, addToCart({ ...base, quantity: 1.5 }));
        expect(state.items).toHaveLength(1);
        expect(state.items[0]).toMatchObject({
            productId: 'p1',
            baseUnit: 'kg',
            quantity: 1.5,
        });
    });

    it('merges the same product+branch+unit, summing with 3-decimal rounding', () => {
        let state = reducer(empty, addToCart({ ...base, quantity: 1.5 }));
        state = reducer(state, addToCart({ ...base, quantity: 0.25 }));
        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(1.75);
    });

    it('keeps a different chosen unit as a separate line', () => {
        let state = reducer(empty, addToCart({ ...base, quantity: 1 }));
        state = reducer(
            state,
            addToCart({ ...base, unitId: 'u-500g', unitLabel: '500g', quantity: 2 }),
        );
        expect(state.items).toHaveLength(2);
    });

    it('updates quantity (rounded) and ignores non-positive updates', () => {
        let state = reducer(empty, addToCart({ ...base, quantity: 1 }));
        const ref = {
            productId: 'p1',
            branchId: 'b1',
            unitId: null,
            byAmount: false,
        };
        state = reducer(state, setQuantity({ ...ref, quantity: 2.255 }));
        expect(state.items[0].quantity).toBe(2.255);
        state = reducer(state, setQuantity({ ...ref, quantity: 0 }));
        expect(state.items[0].quantity).toBe(2.255);
    });

    it('defaults a by-weight line to a null amount', () => {
        const state = reducer(empty, addToCart({ ...base, quantity: 1 }));
        expect(state.items[0].amount).toBeNull();
    });

    it('stores a "buy by amount" line: derived weight + firm cash', () => {
        const state = reducer(
            empty,
            addToCart({ ...base, quantity: 5.882, amount: 1000 }),
        );
        expect(state.items).toHaveLength(1);
        expect(state.items[0]).toMatchObject({ quantity: 5.882, amount: 1000 });
    });

    it('sums two amount adds across both the cash and the derived weight', () => {
        let state = reducer(
            empty,
            addToCart({ ...base, quantity: 5.882, amount: 1000 }),
        );
        state = reducer(
            state,
            addToCart({ ...base, quantity: 2.941, amount: 500 }),
        );
        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(8.823);
        expect(state.items[0].amount).toBe(1500);
    });

    it('keeps an amount line and a weight line of the same product separate', () => {
        let state = reducer(empty, addToCart({ ...base, quantity: 1 }));
        state = reducer(
            state,
            addToCart({ ...base, quantity: 5.882, amount: 1000 }),
        );
        expect(state.items).toHaveLength(2);
        expect(state.items[0].amount).toBeNull();
        expect(state.items[1].amount).toBe(1000);
    });
});
