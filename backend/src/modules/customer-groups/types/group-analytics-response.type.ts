/** Spend by a single member (the paying user) within the window. */
export interface GroupMemberSpendRow {
  userId: string;
  name: string;
  spend: number;
  orders: number;
  sharePct: number;
}

/** Spend by a single product across the group's orders in the window. */
export interface GroupProductSpendRow {
  productId: string;
  productName: string;
  units: number;
  revenue: number;
  sharePct: number;
}

/** One day of group spend (zero-filled across the window). */
export interface GroupTrendPoint {
  date: string;
  revenue: number;
}

/**
 * A group's consolidated purchase analytics for a date window. Counts only real
 * purchases — orders that are COMPLETED (collected) or PAID (online). Spend KPIs
 * use order finalTotal; product breakdown uses item line values.
 */
export interface GroupAnalyticsResponse {
  startDate: string;
  endDate: string;
  groupId: string;
  totalSpend: number;
  orderCount: number;
  avgOrderValue: number;
  memberCount: number;
  byMember: GroupMemberSpendRow[];
  byProduct: GroupProductSpendRow[];
  trend: GroupTrendPoint[];
}
