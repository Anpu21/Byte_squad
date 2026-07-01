import { useCallback } from 'react';
import toast from 'react-hot-toast';
import type { usePosCart } from './usePosCart';
import type { usePosPageState } from './usePosPageState';
import type { usePosHeldBills } from './usePosHeldBills';

interface UsePosHeldBillActionsParams {
    cart: ReturnType<typeof usePosCart>;
    state: ReturnType<typeof usePosPageState>;
    heldBills: ReturnType<typeof usePosHeldBills>;
    setShowHeldBills: (open: boolean) => void;
}

/**
 * Park / resume the current bill. Resuming swaps: a non-empty cart is held
 * first so nothing is lost.
 */
export function usePosHeldBillActions({
    cart,
    state,
    heldBills,
    setShowHeldBills,
}: UsePosHeldBillActionsParams) {
    const billLabel = useCallback(
        () =>
            state.loyaltyOwner?.firstName ??
            cart.cart[0]?.productName ??
            'Held bill',
        [cart.cart, state.loyaltyOwner],
    );

    const holdCurrentBill = useCallback(() => {
        if (cart.cart.length === 0) return;
        heldBills.holdBill({
            label: billLabel(),
            items: cart.cart,
            cartDiscountPercentage: state.cartDiscountPercentage,
            loyaltyOwner: state.loyaltyOwner,
            loyaltyRedeemPoints: state.loyaltyRedeemPoints,
        });
        cart.clear();
        state.resetAfterCheckout();
        toast.success('Bill held — resume it from the shelf anytime');
        state.focusSearch();
    }, [billLabel, cart, heldBills, state]);

    const resumeHeldBill = useCallback(
        (id: string) => {
            const bill = heldBills.takeBill(id);
            if (!bill) return;
            // Swap: a non-empty cart is parked first so nothing is lost.
            if (cart.cart.length > 0) {
                heldBills.holdBill({
                    label: billLabel(),
                    items: cart.cart,
                    cartDiscountPercentage: state.cartDiscountPercentage,
                    loyaltyOwner: state.loyaltyOwner,
                    loyaltyRedeemPoints: state.loyaltyRedeemPoints,
                });
            }
            cart.restore(bill.items);
            state.setCartDiscountPercentage(bill.cartDiscountPercentage);
            state.setLoyaltyOwner(bill.loyaltyOwner);
            state.setLoyaltyRedeemPoints(bill.loyaltyRedeemPoints);
            setShowHeldBills(false);
            toast.success(`Resumed: ${bill.label}`);
        },
        [billLabel, cart, heldBills, state, setShowHeldBills],
    );

    return { holdCurrentBill, resumeHeldBill };
}
