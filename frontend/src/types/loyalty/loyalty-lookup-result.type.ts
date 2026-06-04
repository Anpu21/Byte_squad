import type { LoyaltyTier } from './loyalty-tier.type';

/**
 * Wire shape returned by `GET /loyalty/lookup`. Mirrors
 * `LoyaltyLookupResult` on the backend so the cashier card can render
 * the wallet summary without a follow-up request. `ownerType`
 * discriminates which polymorphic FK column on the underlying account
 * row is populated.
 */
export interface ILoyaltyLookupResult {
    ownerType: 'user' | 'walkIn';
    userId: string | null;
    loyaltyCustomerId: string | null;
    tier: LoyaltyTier;
    firstName: string;
    lastName: string | null;
    phone: string;
    pointsBalance: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
}
