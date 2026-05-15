export interface ILoyaltySettings {
    id: string;
    earnPoints: number;
    earnPerAmount: number;
    pointValue: number;
    redeemCapPercent: number;
    updatedByUserId: string | null;
    updatedAt: string;
}
