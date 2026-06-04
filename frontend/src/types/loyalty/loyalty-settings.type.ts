export interface ILoyaltySettings {
    id: string;
    earnPoints: number;
    earnPerAmount: number;
    pointValue: number;
    redeemCapPercent: number;
    minRedeemablePoints: number;
    silverTierPoints: number;
    goldTierPoints: number;
    updatedByUserId: string | null;
    updatedAt: string;
}
