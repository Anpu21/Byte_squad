/** One stitched customer's purchase aggregates — the raw input to analytics. */
export interface CustomerAnalyticsRow {
  customerKey: string;
  displayName: string;
  lifetimeSpend: number;
  ordersCount: number;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface CustomerAnalyticsSegment {
  segment: string;
  count: number;
  revenue: number;
}

export interface CustomerAnalyticsLeader {
  customerKey: string;
  displayName: string;
  lifetimeSpend: number;
  ordersCount: number;
  lastSeenAt: string | null;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  dormantCustomers: number;
  newCustomers: number;
  neverPurchased: number;
  totalLifetimeValue: number;
  avgLifetimeValue: number;
  segments: CustomerAnalyticsSegment[];
  topCustomers: CustomerAnalyticsLeader[];
}
