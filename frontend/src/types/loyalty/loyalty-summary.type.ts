import type { LoyaltyTier } from './loyalty-tier.type'

export interface ILoyaltySummary {
  pointsBalance: number
  lifetimePointsEarned: number
  lifetimePointsRedeemed: number
  tier: LoyaltyTier
}
