import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePosHeldBillActions } from '../usePosHeldBillActions';
import type { usePosCart } from '../usePosCart';
import type { usePosPageState } from '../usePosPageState';
import type { usePosHeldBills } from '../usePosHeldBills';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IHeldBill } from '@/features/pos/types/held-bill.type';
import type { ICreditAccountSearchResult } from '@/types';

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));
import toast from 'react-hot-toast';

const mockedToast = vi.mocked(toast);

const ITEM = { rowId: 'r1', productName: 'Apples', lineTotal: 1000 } as ICartItem;
const CREDIT = { id: 'ca-1' } as unknown as ICreditAccountSearchResult;

const RESUMED_BILL: IHeldBill = {
    id: 'held-9',
    heldAt: '2026-07-02T10:00:00.000Z',
    label: 'Resumed cart',
    items: [ITEM],
    cartDiscountPercentage: 10,
    loyaltyOwner: null,
    loyaltyRedeemPoints: 0,
    creditAccount: CREDIT,
    creditOverride: null,
};

function setup(opts: { cartItems?: ICartItem[] } = {}) {
    const cart = {
        cart: opts.cartItems ?? [],
        clear: vi.fn(),
        restore: vi.fn(),
    } as unknown as ReturnType<typeof usePosCart>;

    const state = {
        cartDiscountPercentage: 0,
        loyaltyOwner: null,
        loyaltyRedeemPoints: 0,
        creditAccount: null,
        creditOverride: null,
        resetAfterCheckout: vi.fn(),
        focusSearch: vi.fn(),
        setCartDiscountPercentage: vi.fn(),
        setLoyaltyOwner: vi.fn(),
        setLoyaltyRedeemPoints: vi.fn(),
        setCreditAccount: vi.fn(),
        setCreditOverride: vi.fn(),
    } as unknown as ReturnType<typeof usePosPageState>;

    const heldBills = {
        heldBills: [],
        holdBill: vi.fn().mockResolvedValue(undefined),
        takeBill: vi.fn(),
        discardBill: vi.fn(),
    } as unknown as ReturnType<typeof usePosHeldBills>;

    const setShowHeldBills = vi.fn();
    const { result } = renderHook(() =>
        usePosHeldBillActions({ cart, state, heldBills, setShowHeldBills }),
    );
    return { result, cart, state, heldBills, setShowHeldBills };
}

describe('usePosHeldBillActions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('keeps the cart intact when the hold POST rejects', async () => {
        const { result, cart, state, heldBills } = setup({ cartItems: [ITEM] });
        vi.mocked(heldBills.holdBill).mockRejectedValue(new Error('offline'));

        await act(async () => {
            await result.current.holdCurrentBill();
        });

        expect(cart.clear).not.toHaveBeenCalled();
        expect(state.resetAfterCheckout).not.toHaveBeenCalled();
        expect(mockedToast.error).toHaveBeenCalled();
        expect(mockedToast.success).not.toHaveBeenCalled();
    });

    it('clears the cart only after a successful hold, including credit', async () => {
        const { result, cart, state, heldBills } = setup({ cartItems: [ITEM] });

        await act(async () => {
            await result.current.holdCurrentBill();
        });

        expect(heldBills.holdBill).toHaveBeenCalledWith(
            expect.objectContaining({ items: [ITEM] }),
        );
        expect(cart.clear).toHaveBeenCalledTimes(1);
        expect(state.resetAfterCheckout).toHaveBeenCalledTimes(1);
    });

    it('restores credit + override when resuming a held bill', async () => {
        const { result, cart, state, heldBills, setShowHeldBills } = setup();
        vi.mocked(heldBills.takeBill).mockResolvedValue(RESUMED_BILL);

        await act(async () => {
            await result.current.resumeHeldBill('held-9');
        });

        expect(cart.restore).toHaveBeenCalledWith([ITEM]);
        expect(state.setCreditAccount).toHaveBeenCalledWith(CREDIT);
        expect(state.setCreditOverride).toHaveBeenCalledWith(null);
        expect(setShowHeldBills).toHaveBeenCalledWith(false);
    });

    it('aborts the resume (no cart change) when the delete fails', async () => {
        const { result, cart, setShowHeldBills, heldBills } = setup();
        vi.mocked(heldBills.takeBill).mockResolvedValue(null);

        await act(async () => {
            await result.current.resumeHeldBill('held-9');
        });

        expect(cart.restore).not.toHaveBeenCalled();
        expect(setShowHeldBills).not.toHaveBeenCalled();
    });

    it('parks a non-empty cart first when swapping into another bill', async () => {
        const { result, cart, heldBills } = setup({ cartItems: [ITEM] });
        vi.mocked(heldBills.takeBill).mockResolvedValue(RESUMED_BILL);

        await act(async () => {
            await result.current.resumeHeldBill('held-9');
        });

        expect(heldBills.holdBill).toHaveBeenCalledTimes(1); // parked current
        expect(cart.clear).toHaveBeenCalled();
        expect(cart.restore).toHaveBeenCalledWith([ITEM]);
    });
});
