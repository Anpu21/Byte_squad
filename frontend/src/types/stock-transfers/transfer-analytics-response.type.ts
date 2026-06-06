export interface ITransferAnalyticsKpis {
  total: number
  pending: number
  approved: number
  inTransit: number
  completed: number
  rejectedCancelled: number
  totalUnits: number
  avgApprovalHours: number | null
  avgFulfilmentHours: number | null
}

export interface ITransferAnalyticsResponse {
  from: string | null
  to: string | null
  branchId: string | null
  kpis: ITransferAnalyticsKpis
  byStatus: { status: string; count: number }[]
  series: { day: string; count: number }[]
  topProducts: {
    productId: string
    productName: string
    transfers: number
    units: number
  }[]
}
