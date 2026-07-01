import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ISale, TPaymentMethod } from '@/types';
import { applyCartDiscount } from '../components/invoice-total/pos-invoice-total.helpers';
import {
    createInitialTenderBag,
    resolveTenderInputs,
} from '../components/payment-forms/pos-payment-forms.helpers';
import { tryCalculateMultiTender } from '../lib/multi-tender';
import { sizeLoyaltyRedeem } from '../lib/loyalty-redeem-value';
import type { usePosCart } from './usePosCart';
import type { usePosPageState } from './usePosPageState';
import type { usePrintReceipt } from './usePrintReceipt';
import type { usePosLoyaltySettings } from './usePosLoyaltySettings';
import { usePaymentSubmit } from './usePaymentSubmit';

interface UsePosCheckoutParams {
    cart: ReturnType<typeof usePosCart>;
    state: ReturnType<typeof usePosPageState>;
    print: ReturnType<typeof usePrintReceipt>;
    loyaltySettings: ReturnType<typeof usePosLoyaltySettings>['data'];
}

/**
 * Everything from the priced cart to a posted sale: cart-level discount,
 * loyalty-redeem sizing (Model B — points settle money, the Sale total stays
 * gross), the money/credit tender bag, multi-tender validation, and the
 * idempotent checkout submit. The page is a thin view over this.
 */
export function usePosCheckout({
    cart,
    state,
    print,
    loyaltySettings,
}: UsePosCheckoutParams) {
    const invoiceTotal = applyCartDiscount(
        cart.itemsSubtotal,
        cart.totalDiscount,
        cart.totalTax,
        state.cartDiscountPercentage,
    ).cartTotal;

    // Redeemed loyalty points settle part of the bill (Model B): the cashier
    // collects `invoiceTotal - redeemValue` in money while the Sale total
    // stays gross. Sized via the shared helper so the cap + money value match
    // the backend's `previewRedeemValue`; the backend re-caps authoritatively.
    const loyaltyRedeem = useMemo(
        () =>
            sizeLoyaltyRedeem({
                owner: state.loyaltyOwner,
                requestedPoints: state.loyaltyRedeemPoints,
                itemsSubtotal: cart.itemsSubtotal,
                settings: loyaltySettings ?? null,
            }),
        [
            state.loyaltyOwner,
            state.loyaltyRedeemPoints,
            cart.itemsSubtotal,
            loyaltySettings,
        ],
    );
    const payableByMoney = Math.max(
        0,
        Math.round((invoiceTotal - loyaltyRedeem.redeemValue) * 100) / 100,
    );

    const [cashTendered, setCashTendered] = useState(payableByMoney);
    useEffect(() => {
        setCashTendered(payableByMoney);
    }, [payableByMoney]);

    const [idempotencyKey, setIdempotencyKey] = useState(() =>
        crypto.randomUUID(),
    );

    // Buy-on-credit: a khata account attached via the credit card unlocks the
    // "On credit" tender. Detaching it falls the method back to Cash.
    const creditAccount = state.creditAccount;
    const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>('Cash');
    const [showOverride, setShowOverride] = useState(false);
    useEffect(() => {
        if (!creditAccount && paymentMethod !== 'Cash') setPaymentMethod('Cash');
    }, [creditAccount, paymentMethod]);
    const onCredit = paymentMethod === 'Credit' && creditAccount !== null;

    const bag = useMemo(
        () => ({
            ...createInitialTenderBag(payableByMoney),
            cashTendered,
            // On credit the whole gross invoice rides the khata; loyalty redeem
            // is ignored — the credit account is the payer, not a money tender.
            creditAmount: onCredit ? invoiceTotal : 0,
        }),
        [payableByMoney, cashTendered, onCredit, invoiceTotal],
    );

    const tenderInputs = useMemo(
        () =>
            resolveTenderInputs(
                paymentMethod,
                bag,
                onCredit ? invoiceTotal : payableByMoney,
            ),
        [paymentMethod, bag, onCredit, invoiceTotal, payableByMoney],
    );
    const calc = useMemo(
        () => tryCalculateMultiTender(tenderInputs),
        [tenderInputs],
    );

    // Over-limit credit charges need a manager override token before they post.
    const creditAvailable = creditAccount?.availableCredit ?? null;
    const overLimit =
        onCredit && creditAvailable !== null && invoiceTotal > creditAvailable;
    const hasValidOverride =
        state.creditOverride !== null &&
        state.creditOverride.amount + 0.001 >= invoiceTotal;
    const needsOverride = overLimit && !hasValidOverride;

    const handleSaleCreated = useCallback(
        (sale: ISale) => {
            state.setLastSale(sale);
            cart.clear();
            state.resetAfterCheckout();
            void print.printReceipt(sale);
            window.setTimeout(() => state.focusSearch(), 0);
        },
        [cart, print, state],
    );

    const submit = usePaymentSubmit({
        cart: cart.cart,
        cartDiscountPercentage: state.cartDiscountPercentage,
        paymentMethod,
        bag,
        tenderInputs,
        idempotencyKey,
        // On credit the khata is the payer — drop loyalty so the payload never
        // sends creditAccountId + customerUserId (the backend rejects that).
        loyaltyOwner: onCredit ? null : state.loyaltyOwner,
        loyaltyRedeemPoints: onCredit ? 0 : loyaltyRedeem.cappedPoints,
        creditAccountId: onCredit && creditAccount ? creditAccount.id : null,
        creditOverrideToken: onCredit
            ? (state.creditOverride?.token ?? null)
            : null,
        onSaleCreated: (sale) => {
            setIdempotencyKey(crypto.randomUUID());
            handleSaleCreated(sale);
        },
        onClose: () => {},
    });

    const hasError = calc === null;
    // A fully points-covered bill has zero money tender but is still
    // chargeable, so only block on an empty tender when no points settle it.
    const isEmptyTender =
        calc !== null &&
        calc.paymentAmount === 0 &&
        loyaltyRedeem.redeemValue === 0;
    const disableCharge =
        submit.isPending ||
        hasError ||
        isEmptyTender ||
        cart.cart.length === 0 ||
        needsOverride;
    const handlePrintLast = useCallback(() => {
        if (state.lastSale) void print.printReceipt(state.lastSale);
    }, [print, state.lastSale]);

    return {
        invoiceTotal,
        payableByMoney,
        loyaltyRedeem,
        cashTendered,
        setCashTendered,
        paymentMethod,
        setPaymentMethod,
        showOverride,
        setShowOverride,
        onCredit,
        calc,
        hasError,
        disableCharge,
        creditAccount,
        submit,
        handlePrintLast,
    };
}
