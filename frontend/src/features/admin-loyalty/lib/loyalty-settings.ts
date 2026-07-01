import type { ILoyaltySettings } from '@/types';

export interface FormState {
    earnPoints: string;
    earnPerAmount: string;
    pointValue: string;
    redeemCapPercent: string;
    minRedeemablePoints: string;
    silverTierPoints: string;
    goldTierPoints: string;
}

export function toForm(s: ILoyaltySettings | undefined): FormState {
    return {
        earnPoints: String(s?.earnPoints ?? 1),
        earnPerAmount: String(s?.earnPerAmount ?? 100),
        pointValue: String(s?.pointValue ?? 1),
        redeemCapPercent: String(s?.redeemCapPercent ?? 20),
        minRedeemablePoints: String(s?.minRedeemablePoints ?? 100),
        silverTierPoints: String(s?.silverTierPoints ?? 1000),
        goldTierPoints: String(s?.goldTierPoints ?? 5000),
    };
}

export function toPreview(form: FormState): ILoyaltySettings {
    return {
        id: 'preview',
        earnPoints: Number(form.earnPoints) || 0,
        earnPerAmount: Number(form.earnPerAmount) || 1,
        pointValue: Number(form.pointValue) || 0,
        redeemCapPercent: Number(form.redeemCapPercent) || 0,
        minRedeemablePoints: Number(form.minRedeemablePoints) || 0,
        silverTierPoints: Number(form.silverTierPoints) || 0,
        goldTierPoints: Number(form.goldTierPoints) || 0,
        updatedByUserId: null,
        updatedAt: new Date().toISOString(),
    };
}

export function validate(form: FormState): string | null {
    const earnPoints = Number(form.earnPoints);
    const earnPerAmount = Number(form.earnPerAmount);
    const pointValue = Number(form.pointValue);
    const cap = Number(form.redeemCapPercent);
    const minRedeemablePoints = Number(form.minRedeemablePoints);
    const silverTierPoints = Number(form.silverTierPoints);
    const goldTierPoints = Number(form.goldTierPoints);
    if (!Number.isInteger(earnPoints) || earnPoints < 0) {
        return 'Points earned must be a non-negative integer.';
    }
    if (!Number.isInteger(earnPerAmount) || earnPerAmount < 1) {
        return 'LKR amount must be a positive integer.';
    }
    if (!Number.isFinite(pointValue) || pointValue < 0) {
        return 'Point value must be 0 or higher.';
    }
    if (!Number.isInteger(cap) || cap < 0 || cap > 100) {
        return 'Redemption cap must be between 0 and 100.';
    }
    if (!Number.isInteger(minRedeemablePoints) || minRedeemablePoints < 0) {
        return 'Minimum redeemable reserve must be a non-negative integer.';
    }
    if (!Number.isInteger(silverTierPoints) || silverTierPoints < 0) {
        return 'Silver tier threshold must be a non-negative integer.';
    }
    if (!Number.isInteger(goldTierPoints) || goldTierPoints < 0) {
        return 'Gold tier threshold must be a non-negative integer.';
    }
    if (silverTierPoints > goldTierPoints) {
        return 'Silver tier threshold cannot exceed Gold.';
    }
    return null;
}
