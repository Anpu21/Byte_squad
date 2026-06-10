import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePosHeldBills } from '../usePosHeldBills';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IHeldBill } from '@/features/pos/types/held-bill.type';

const ITEM: ICartItem = {
    rowId: 'row-1',
    productId: 'p1',
    productCode: 'P001',
    productName: 'Anchor Milk 1L',
    productType: 'Grocery',
    baseUnit: 'L',
    unitId: null,
    unitName: 'L',
    unitPrice: 575,
    conversionFactor: 1,
    quantity: 2,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
    lineSubtotal: 1150,
    lineDiscountAmount: 0,
    lineTaxAmount: 0,
    lineTotal: 1150,
    baseUnitQty: 2,
};

const SEED = {
    label: 'Anchor Milk 1L',
    items: [ITEM],
    cartDiscountPercentage: 5,
    loyaltyOwner: null,
    loyaltyRedeemPoints: 0,
};

describe('usePosHeldBills', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('holds a bill newest-first and persists to localStorage', () => {
        const { result } = renderHook(() => usePosHeldBills());
        act(() => result.current.holdBill(SEED));
        act(() => result.current.holdBill({ ...SEED, label: 'Second' }));

        expect(result.current.heldBills).toHaveLength(2);
        expect(result.current.heldBills[0]?.label).toBe('Second');

        const raw = localStorage.getItem('ledgerpro_pos_held_bills');
        expect(raw).toContain('Anchor Milk 1L');
    });

    it('takeBill removes and returns the bill', () => {
        const { result } = renderHook(() => usePosHeldBills());
        act(() => result.current.holdBill(SEED));
        const id = result.current.heldBills[0]!.id;

        let taken: IHeldBill | null = null;
        act(() => {
            taken = result.current.takeBill(id);
        });
        expect(taken!.items[0]?.productName).toBe('Anchor Milk 1L');
        expect(result.current.heldBills).toHaveLength(0);
    });

    it('takeBill returns null for an unknown id', () => {
        const { result } = renderHook(() => usePosHeldBills());
        let taken: IHeldBill | null = null;
        act(() => {
            taken = result.current.takeBill('missing');
        });
        expect(taken).toBeNull();
    });

    it('survives a remount via localStorage', () => {
        const first = renderHook(() => usePosHeldBills());
        act(() => first.result.current.holdBill(SEED));
        first.unmount();

        const second = renderHook(() => usePosHeldBills());
        expect(second.result.current.heldBills).toHaveLength(1);
        expect(second.result.current.heldBills[0]?.cartDiscountPercentage).toBe(
            5,
        );
    });
});
