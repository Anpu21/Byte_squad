/**
 * Phone-lookup response surface for the POS cashier card. Always
 * carries the wallet summary so the cashier can see the redeemable
 * balance without a second round-trip. `ownerType` discriminates
 * which FK column on the underlying account row is set.
 */
export interface LoyaltyLookupResult {
  ownerType: 'user' | 'walkIn';
  userId: string | null;
  loyaltyCustomerId: string | null;
  tier: 'bronze' | 'silver' | 'gold';
  firstName: string;
  lastName: string | null;
  phone: string;
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
}
