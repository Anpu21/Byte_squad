export interface ILoyaltyCustomerRow {
    id: string;
    /** Discriminates which polymorphic owner column is set. */
    ownerType: 'user' | 'walkIn';
    /** Set when `ownerType === 'user'`; null for walk-ins. */
    userId: string | null;
    /** Set when `ownerType === 'walkIn'`; null for online users. */
    loyaltyCustomerId: string | null;
    firstName: string;
    /** Walk-ins may not have a last name. */
    lastName: string | null;
    /** Walk-ins have no email. */
    email: string | null;
    /** Users may not have a phone. */
    phone: string | null;
    pointsBalance: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
    lastActivityAt: string | null;
    /** Branch id of the most-recent ledger entry; null for online-only activity. */
    lastActivityBranchId: string | null;
    /** Branch name for `lastActivityBranchId`; null when the branch is null. */
    lastActivityBranchName: string | null;
}

export interface ILoyaltyCustomersResponse {
    rows: ILoyaltyCustomerRow[];
    total: number;
    limit: number;
    offset: number;
}
