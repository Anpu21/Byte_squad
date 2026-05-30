import { useCallback } from 'react';
import { usePosCreateSale } from '@/features/pos/hooks/usePosCreateSale';
import {
    buildSalePayload,
    type ITenderBag,
} from '@/features/pos/components/payment-forms/pos-payment-forms.helpers';
import type { IMultiTenderInputs } from '@/features/pos/lib/multi-tender';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type {
    ISale,
    TPaymentMethod,
} from '@/types';

interface IUsePaymentSubmitArgs {
    cart: ICartItem[];
    cartDiscountPercentage: number;
    paymentMethod: TPaymentMethod;
    bag: ITenderBag;
    tenderInputs: IMultiTenderInputs;
    idempotencyKey: string;
    /** Optional loyalty owner attached upstream; null when no member is bound. */
    loyaltyOwner: IPosLoyaltyOwner | null;
    /** Whole points to redeem against this sale; 0 disables redemption. */
    loyaltyRedeemPoints: number;
    onSaleCreated: (sale: ISale) => void;
    onClose: () => void;
}

interface IUsePaymentSubmitReturn {
    handleCharge: (paymentAmount: number) => Promise<void>;
    isPending: boolean;
    error: Error | null;
}

/**
 * Owns the `POST /pos/sales` round-trip for the cashier charge modal.
 * Builds the payload from the live cart + tender bag, awaits the mutation,
 * and on success fires `onSaleCreated(sale)` then `onClose()`. On failure
 * we swallow — `error` surfaces via the orchestrator banner so the cashier
 * can retry against the same idempotency key (backend dedupes).
 */
export function usePaymentSubmit(
    args: IUsePaymentSubmitArgs,
): IUsePaymentSubmitReturn {
    const createSale = usePosCreateSale();
    const handleCharge = useCallback(
        async (paymentAmount: number) => {
            const payload = buildSalePayload({
                ...args,
                paymentAmount,
                cashAmount: args.tenderInputs.cashAmount,
                loyaltyOwner: args.loyaltyOwner,
                loyaltyRedeemPoints: args.loyaltyRedeemPoints,
            });
            try {
                const sale = await createSale.mutateAsync({
                    payload,
                    idempotencyKey: args.idempotencyKey,
                });
                args.onSaleCreated(sale);
                args.onClose();
            } catch {
                // Stay open; banner renders from `error` below.
            }
        },
        [args, createSale],
    );

    return {
        handleCharge,
        isPending: createSale.isPending,
        error: (createSale.error as Error | null) ?? null,
    };
}
