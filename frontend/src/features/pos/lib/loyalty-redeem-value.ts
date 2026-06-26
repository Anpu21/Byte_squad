import type { ILoyaltySettings } from '@/types';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface ILoyaltyRedeemSizing {
    /** Points actually applied after the server-mirrored cap. */
    cappedPoints: number;
    /** Money value of `cappedPoints` at the current point value. */
    redeemValue: number;
    /** Upper bound the cashier may redeem on this bill (for input clamping). */
    maxRedeemable: number;
}

const EMPTY: ILoyaltyRedeemSizing = {
    cappedPoints: 0,
    redeemValue: 0,
    maxRedeemable: 0,
};

/**
 * Frontend mirror of the backend `LoyaltyWalletService.calculateMaxRedeemable`
 * + `previewRedeemValue` (see
 * `backend/src/modules/loyalty/loyalty-wallet.service.ts`). It caps the
 * cashier's requested points to
 *
 *   min(balance − minRedeemablePoints, ⌊itemsSubtotal · capPct / 100 / pointValue⌋)
 *
 * and prices the result, so the cashier-facing payable and the
 * server-side redemption land on identical numbers. The cap base is the
 * pre-tax `itemsSubtotal` — the SAME figure the backend redeem path uses —
 * not the gross total, so the two never drift.
 *
 * Returns zeros when no owner is attached. When settings haven't loaded
 * yet it falls back to a balance-only cap at point value 1 (the backend
 * re-caps authoritatively on submit, so a brief pre-load estimate is safe).
 */
export function sizeLoyaltyRedeem(params: {
    owner: IPosLoyaltyOwner | null;
    requestedPoints: number;
    itemsSubtotal: number;
    settings: ILoyaltySettings | null;
}): ILoyaltyRedeemSizing {
    const { owner, requestedPoints, itemsSubtotal, settings } = params;
    if (!owner) return EMPTY;

    const pointValue =
        settings && settings.pointValue > 0 ? settings.pointValue : 1;
    const maxRedeemable = settings
        ? Math.max(
              0,
              Math.min(
                  owner.pointsBalance - settings.minRedeemablePoints,
                  Math.floor(
                      (itemsSubtotal * settings.redeemCapPercent) /
                          100 /
                          pointValue,
                  ),
              ),
          )
        : Math.max(0, owner.pointsBalance);

    const cappedPoints = Math.max(
        0,
        Math.min(Math.floor(requestedPoints), maxRedeemable),
    );

    return {
        cappedPoints,
        redeemValue: round2(cappedPoints * pointValue),
        maxRedeemable,
    };
}
