import type { IBranchAnalyticsTopProduct } from './branch-analytics-top-product.type'

export interface IBranchFinancialMetrics {
  revenue: number
  expenses: number
  grossProfit: number
  expenseRatio: number
}

export interface IBranchSalesMetrics {
  transactionCount: number
  avgTransactionValue: number
  discountTotal: number
  taxTotal: number
  topProducts: IBranchAnalyticsTopProduct[]
}

export interface IBranchInventoryMetrics {
  activeProducts: number
  lowStockItems: number
  outOfStockItems: number
  totalStockQuantity: number
}

export interface IBranchLoyaltyMetrics {
  activeMembers: number
  pointsEarned: number
  pointsRedeemed: number
  pointsReversed: number
  liabilityValue: number
  tierCounts: {
    bronze: number
    silver: number
    gold: number
  }
  channelSplit: {
    physicalEvents: number
    onlineEvents: number
    physicalPoints: number
    onlinePoints: number
  }
}

export interface IBranchCustomerMetrics {
  pickupOrders: number
  completedOrders: number
  cancelledOrders: number
  rejectedOrders: number
  uniqueCustomers: number
}

export interface IBranchPaymentMetrics {
  cashAmount: number
  cardAmount: number
  mobileAmount: number
  chequeAmount: number
  bankAmount: number
  creditAmount: number
}

export interface IBranchStaffMetrics {
  staffCount: number
  revenuePerStaff: number
}
