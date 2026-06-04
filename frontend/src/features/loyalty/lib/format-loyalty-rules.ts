import type { ILoyaltySettings } from '@/types';

const FALLBACK: ILoyaltySettings = {
    id: 'default',
    earnPoints: 1,
    earnPerAmount: 100,
    pointValue: 1,
    redeemCapPercent: 20,
    minRedeemablePoints: 100,
    silverTierPoints: 1000,
    goldTierPoints: 5000,
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
    return `Use points above ${s.minRedeemablePoints} pts, capped at ${s.redeemCapPercent}% of the order subtotal`;
}

export function formatTierRule(settings: ILoyaltySettings | undefined): string {
    const s = settings ?? FALLBACK;
    return `Silver starts at ${s.silverTierPoints} lifetime pts · Gold starts at ${s.goldTierPoints} lifetime pts`;
}
