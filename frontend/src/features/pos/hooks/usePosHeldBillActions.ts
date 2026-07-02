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
 * Park / resume the current bill. Every server step is awaited so nothing is
 * cleared or restored until it's confirmed: a failed hold leaves the cart
 * intact, and a resume removes the bill from the shelf before loading it (no
 * double-sell). Resuming with a non-empty cart parks it first so nothing is
 * lost in the swap.
 */
export function usePosHeldBillActions({
    cart,
    state,
    heldBills,
    setShowHeldBills,
}: UsePosHeldBillActionsParams) {
    const snapshotCurrent = useCallback(
        () => ({
            label:
                state.loyaltyOwner?.firstName ??
                cart.cart[0]?.productName ??
                'Held bill',
            items: cart.cart,
            cartDiscountPercentage: state.cartDiscountPercentage,
            loyaltyOwner: state.loyaltyOwner,
            loyaltyRedeemPoints: state.loyaltyRedeemPoints,
            creditAccount: state.creditAccount,
            creditOverride: state.creditOverride,
        }),
        [cart.cart, state],
    );

    const holdCurrentBill = useCallback(async () => {
        if (cart.cart.length === 0) return;
        try {
            await heldBills.holdBill(snapshotCurrent());
        } catch {
            toast.error('Could not hold the bill — it is still in your cart');
            return;
        }
        cart.clear();
        state.resetAfterCheckout();
        toast.success('Bill held — resume it from the shelf anytime');
        state.focusSearch();
    }, [cart, heldBills, state, snapshotCurrent]);

    const resumeHeldBill = useCallback(
        async (id: string) => {
            // Swap: park a non-empty cart FIRST so nothing is lost. Abort if the
            // park fails — nothing destructive has happened yet.
            if (cart.cart.length > 0) {
                try {
                    await heldBills.holdBill(snapshotCurrent());
                } catch {
                    toast.error(
                        'Could not park the current bill — nothing changed',
                    );
                    return;
                }
                cart.clear();
                state.resetAfterCheckout();
            }

            // Removes the bill server-side first; null means the delete failed
            // (takeBill toasts) and the current cart is already safely parked.
            const bill = await heldBills.takeBill(id);
            if (!bill) return;

            cart.restore(bill.items);
            state.setCartDiscountPercentage(bill.cartDiscountPercentage);
            state.setLoyaltyOwner(bill.loyaltyOwner);
            state.setLoyaltyRedeemPoints(bill.loyaltyRedeemPoints);
            state.setCreditAccount(bill.creditAccount);
            state.setCreditOverride(bill.creditOverride);
            setShowHeldBills(false);
            toast.success(`Resumed: ${bill.label}`);
        },
        [cart, heldBills, state, setShowHeldBills, snapshotCurrent],
    );

    return { holdCurrentBill, resumeHeldBill };
}
