import type { ILoyaltySettings } from '@/types';

const FALLBACK: ILoyaltySettings = {
    id: 'default',
    earnPoints: 1,
    earnPerAmount: 100,
    pointValue: 1,
    redeemCapPercent: 20,
    updatedByUserId: null,
    updatedAt: new Date(0).toISOString(),
};

function pluralPoints(n: number): string {
    return n === 1 ? '1 point' : `${n} points`;
}

function formatPointValue(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatEarnRule(settings: ILoyaltySettings | undefined): string {
    const s = settings ?? FALLBACK;
    return `Earn ${pluralPoints(s.earnPoints)} for every LKR ${s.earnPerAmount} paid at pickup`;
}

export function formatPointValueRule(
    settings: ILoyaltySettings | undefined,
): string {
    const s = settings ?? FALLBACK;
    return `Redeem 1 point as LKR ${formatPointValue(s.pointValue)} off any order`;
}

export function formatRedeemCapRule(
    settings: ILoyaltySettings | undefined,
): string {
    const s = settings ?? FALLBACK;
    return `Use up to ${s.redeemCapPercent}% of any order subtotal in points`;
}
