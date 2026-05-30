import { useCallback, useState } from 'react';

/**
 * Trimmed projection of the loyalty owner attached to the in-progress
 * sale. The full `ILoyaltyLookupResult` carries last-name + lifetime
 * counters that the cashier card already reads from the query result;
 * the page only needs enough to build the create-sale payload and to
 * show the attached pill above the bill preview.
 */
export interface IPosLoyaltyOwner {
    ownerType: 'user' | 'walkIn';
    userId: string | null;
    loyaltyCustomerId: string | null;
    firstName: string;
    pointsBalance: number;
}

export interface IUseLoyaltyAttachReturn {
    loyaltyOwner: IPosLoyaltyOwner | null;
    setLoyaltyOwner: (owner: IPosLoyaltyOwner | null) => void;
    loyaltyRedeemPoints: number;
    setLoyaltyRedeemPoints: (next: number) => void;
    /** Called by `usePosPageState.resetAfterCheckout` to clear both slots. */
    resetLoyalty: () => void;
}

/**
 * Owns the cashier's loyalty attach state for the active sale: the
 * resolved owner snapshot and the requested redeem amount. Extracted
 * from `usePosPageState` so that hook stays inside its line budget
 * (the loyalty slot adds two state pairs plus a reset callback).
 *
 * Both slots are intentionally kept dumb — the card component runs
 * the validation (digit threshold, balance cap) and the page hook
 * just persists what the card resolved.
 */
export function useLoyaltyAttach(): IUseLoyaltyAttachReturn {
    const [loyaltyOwner, setLoyaltyOwner] = useState<IPosLoyaltyOwner | null>(
        null,
    );
    const [loyaltyRedeemPoints, setLoyaltyRedeemPoints] = useState(0);
    const resetLoyalty = useCallback(() => {
        setLoyaltyOwner(null);
        setLoyaltyRedeemPoints(0);
    }, []);
    return {
        loyaltyOwner,
        setLoyaltyOwner,
        loyaltyRedeemPoints,
        setLoyaltyRedeemPoints,
        resetLoyalty,
    };
}
