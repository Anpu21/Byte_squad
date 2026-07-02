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
    /**
     * When `maxRedeemable` is 0, a plain-language reason the cashier can't
     * redeem yet (below the minimum balance, empty cart, or bill too small).
     * Null when redemption is available, or when settings haven't loaded.
     */
    disabledReason: string | null;
}

const EMPTY: ILoyaltyRedeemSizing = {
    cappedPoints: 0,
    redeemValue: 0,
    maxRedeemable: 0,
    disabledReason: null,
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
 * When the cap lands on 0 it also explains why (`disabledReason`) so the
 * card never shows a bare "Redeem up to 0" the cashier can't act on.
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
        disabledReason: reasonForZeroCap({
            maxRedeemable,
            balance: owner.pointsBalance,
            itemsSubtotal,
            settings,
        }),
    };
}

/**
 * Explains a zero redeem cap in cashier terms. Priority: below-minimum
 * balance (a permanent block for this member) → empty cart → bill too small
 * for the redeem-cap percentage. Null when redemption is possible or when
 * settings are still loading (so we never show a misleading reason).
 */
function reasonForZeroCap(params: {
    maxRedeemable: number;
    balance: number;
    itemsSubtotal: number;
    settings: ILoyaltySettings | null;
}): string | null {
    const { maxRedeemable, balance, itemsSubtotal, settings } = params;
    if (maxRedeemable > 0 || !settings) return null;
    if (balance < settings.minRedeemablePoints) {
        return `Needs ${settings.minRedeemablePoints.toLocaleString()}+ points to redeem (has ${balance.toLocaleString()}).`;
    }
    if (itemsSubtotal <= 0) {
        return 'Add items to the bill to redeem points.';
    }
    return `Bill too small to redeem yet — up to ${settings.redeemCapPercent}% can be paid with points.`;
}
