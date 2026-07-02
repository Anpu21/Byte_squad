import type { CustomerStatus } from './customer-status.type';
import type { CustomerType } from './customer-type.type';

export interface CustomerProfileKpis {
  loyaltyPoints: number;
  creditBalance: number;
  ordersCount: number;
  lifetimeSpend: number;
  avgOrderValue: number;
  lastSeenAt: string | null;
}

export interface CustomerCreditAccountSummary {
  id: string;
  accountNo: string;
  status: string;
  currentBalance: number;
  creditLimit: number | null;
  branchName: string | null;
}

export interface CustomerRecentSale {
  id: string;
  invoiceNumber: string;
  total: number;
  createdAt: string;
  branchName: string | null;
}

export interface CustomerRecentOrder {
  id: string;
  orderCode: string;
  status: string;
  finalTotal: number;
  createdAt: string;
}

/** The composed 360 profile for one stitched customer. */
export interface CustomerProfileDetail {
  customerKey: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  types: CustomerType[];
  homeBranchId: string | null;
  homeBranchName: string | null;
  status: CustomerStatus;
  tags: string[];
  notes: string | null;
  segment: string | null;
  kpis: CustomerProfileKpis;
  creditAccounts: CustomerCreditAccountSummary[];
  recentSales: CustomerRecentSale[];
  recentOrders: CustomerRecentOrder[];
  /** Underlying source ids, so the client can lazy-load full history via the
   * existing loyalty / credit / orders endpoints. */
  ids: { userIds: string[]; loyaltyIds: string[]; creditIds: string[] };
}
