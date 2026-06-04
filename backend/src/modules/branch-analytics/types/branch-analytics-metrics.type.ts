import type { BranchAnalyticsTopProduct } from './branch-analytics-top-product.type';

export interface BranchFinancialMetrics {
  revenue: number;
  expenses: number;
  grossProfit: number;
  expenseRatio: number;
}

export interface BranchSalesMetrics {
  transactionCount: number;
  avgTransactionValue: number;
  discountTotal: number;
  taxTotal: number;
  topProducts: BranchAnalyticsTopProduct[];
}

export interface BranchInventoryMetrics {
  activeProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStockQuantity: number;
}

export interface BranchLoyaltyMetrics {
  activeMembers: number;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsReversed: number;
  liabilityValue: number;
  tierCounts: {
    bronze: number;
    silver: number;
    gold: number;
  };
  channelSplit: {
    physicalEvents: number;
    onlineEvents: number;
    physicalPoints: number;
    onlinePoints: number;
  };
}

export interface BranchCustomerMetrics {
  pickupOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  uniqueCustomers: number;
}

export interface BranchPaymentMetrics {
  cashAmount: number;
  cardAmount: number;
  mobileAmount: number;
  chequeAmount: number;
  bankAmount: number;
  creditAmount: number;
}

export interface BranchStaffMetrics {
  staffCount: number;
  revenuePerStaff: number;
}
