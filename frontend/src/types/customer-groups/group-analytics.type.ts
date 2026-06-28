export interface IGroupMemberSpendRow {
  userId: string
  name: string
  spend: number
  orders: number
  sharePct: number
}

export interface IGroupProductSpendRow {
  productId: string
  productName: string
  units: number
  revenue: number
  sharePct: number
}

export interface IGroupTrendPoint {
  date: string
  revenue: number
}

export interface IGroupAnalyticsResponse {
  startDate: string
  endDate: string
  groupId: string
  totalSpend: number
  orderCount: number
  avgOrderValue: number
  memberCount: number
  byMember: IGroupMemberSpendRow[]
  byProduct: IGroupProductSpendRow[]
  trend: IGroupTrendPoint[]
}

export interface IGroupAnalyticsParams {
  startDate: string
  endDate: string
}
