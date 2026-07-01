import { describe, it, expect } from 'vitest';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type { ILoyaltySettings } from '@/types';
import { sizeLoyaltyRedeem } from './loyalty-redeem-value';

function owner(overrides: Partial<IPosLoyaltyOwner> = {}): IPosLoyaltyOwner {
    return {
        ownerType: 'walkIn',
        userId: null,
        loyaltyCustomerId: 'walkin-1',
        tier: 'bronze',
        firstName: 'Nimal',
        pointsBalance: 500,
        ...overrides,
    };
}

function settings(overrides: Partial<ILoyaltySettings> = {}): ILoyaltySettings {
    return {
        id: 'default',
        earnPoints: 1,
        earnPerAmount: 100,
        pointValue: 1,
        redeemCapPercent: 20,
        minRedeemablePoints: 100,
        silverTierPoints: 1000,
        goldTierPoints: 5000,
        updatedByUserId: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('sizeLoyaltyRedeem', () => {
    it('returns zeros when no owner is attached', () => {
        expect(
            sizeLoyaltyRedeem({
                owner: null,
                requestedPoints: 100,
                itemsSubtotal: 1000,
                settings: settings(),
            }),
        ).toEqual({
            cappedPoints: 0,
            redeemValue: 0,
            maxRedeemable: 0,
            disabledReason: null,
        });
    });

    it('caps on the subtotal percentage and prices at the point value', () => {
        // cap = min(500 - 100, floor(1000 * 20% / 1)) = min(400, 200) = 200
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 500 }),
            requestedPoints: 150,
            itemsSubtotal: 1000,
            settings: settings(),
        });
        expect(result.maxRedeemable).toBe(200);
        expect(result.cappedPoints).toBe(150);
        expect(result.redeemValue).toBe(150);
    });

    it('clamps a request above the cap down to the cap', () => {
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 500 }),
            requestedPoints: 999,
            itemsSubtotal: 1000,
            settings: settings(),
        });
        expect(result.cappedPoints).toBe(200);
        expect(result.redeemValue).toBe(200);
    });

    it('prices the redeem value at a non-unit point value', () => {
        // pointValue 2 → pointsForCap = floor(1000 * 20% / 2) = 100
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 500 }),
            requestedPoints: 999,
            itemsSubtotal: 1000,
            settings: settings({ pointValue: 2 }),
        });
        expect(result.cappedPoints).toBe(100);
        expect(result.redeemValue).toBe(200); // 100 * 2
    });

    it('reserves the minimum redeemable balance', () => {
        // balance 150, minRedeemablePoints 100 → redeemable balance 50
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 150 }),
            requestedPoints: 120,
            itemsSubtotal: 1000,
            settings: settings(),
        });
        expect(result.maxRedeemable).toBe(50);
        expect(result.cappedPoints).toBe(50);
    });

    it('returns a zero cap + reason when the balance is below the minimum', () => {
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 80 }),
            requestedPoints: 50,
            itemsSubtotal: 1000,
            settings: settings(),
        });
        expect(result.maxRedeemable).toBe(0);
        expect(result.cappedPoints).toBe(0);
        expect(result.redeemValue).toBe(0);
        expect(result.disabledReason).toMatch(/Needs 100\+ points/);
    });

    it('explains an empty cart when the balance qualifies but no items exist', () => {
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 500 }),
            requestedPoints: 100,
            itemsSubtotal: 0,
            settings: settings(),
        });
        expect(result.maxRedeemable).toBe(0);
        expect(result.disabledReason).toMatch(/Add items/);
    });

    it('explains a bill too small for the redeem-cap percentage', () => {
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 500 }),
            requestedPoints: 100,
            itemsSubtotal: 4, // floor(4 * 20% / 1) = 0
            settings: settings(),
        });
        expect(result.maxRedeemable).toBe(0);
        expect(result.disabledReason).toMatch(/too small/);
    });

    it('has no reason when redemption is available', () => {
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 500 }),
            requestedPoints: 100,
            itemsSubtotal: 1000,
            settings: settings(),
        });
        expect(result.maxRedeemable).toBeGreaterThan(0);
        expect(result.disabledReason).toBeNull();
    });

    it('falls back to a balance-only cap when settings are unavailable', () => {
        const result = sizeLoyaltyRedeem({
            owner: owner({ pointsBalance: 75 }),
            requestedPoints: 999,
            itemsSubtotal: 1000,
            settings: null,
        });
        expect(result.maxRedeemable).toBe(75);
        expect(result.cappedPoints).toBe(75);
        expect(result.redeemValue).toBe(75);
    });
});
