export interface ILoyaltyCustomerRow {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    pointsBalance: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
    lastActivityAt: string;
}

export interface ILoyaltyCustomersResponse {
    rows: ILoyaltyCustomerRow[];
    total: number;
    limit: number;
    offset: number;
}
