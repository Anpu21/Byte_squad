export interface ICustomerAnalyticsSegment {
  segment: string
  count: number
  revenue: number
}

export interface ICustomerAnalyticsLeader {
  customerKey: string
  displayName: string
  lifetimeSpend: number
  ordersCount: number
  lastSeenAt: string | null
}

export interface ICustomerAnalytics {
  totalCustomers: number
  activeCustomers: number
  atRiskCustomers: number
  dormantCustomers: number
  newCustomers: number
  neverPurchased: number
  totalLifetimeValue: number
  avgLifetimeValue: number
  segments: ICustomerAnalyticsSegment[]
  topCustomers: ICustomerAnalyticsLeader[]
}
