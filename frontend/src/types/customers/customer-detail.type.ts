import type { CustomerStatus } from './customer-status.type'
import type { CustomerType } from './customer-type.type'

export interface ICustomerProfileKpis {
  loyaltyPoints: number
  creditBalance: number
  ordersCount: number
  lifetimeSpend: number
  avgOrderValue: number
  lastSeenAt: string | null
}

export interface ICustomerCreditAccountSummary {
  id: string
  accountNo: string
  status: string
  currentBalance: number
  creditLimit: number | null
  branchName: string | null
}

export interface ICustomerRecentSale {
  id: string
  invoiceNumber: string
  total: number
  createdAt: string
  branchName: string | null
}

export interface ICustomerRecentOrder {
  id: string
  orderCode: string
  status: string
  finalTotal: number
  createdAt: string
}

export interface ICustomerProfileUpdate {
  tags?: string[]
  notes?: string
  segment?: string
  status?: CustomerStatus
}

/** Edits to a walk-in loyalty record (name/phone) via the loyalty module. */
export interface IWalkInUpdate {
  firstName?: string
  lastName?: string
  phone?: string
}

export interface ICustomerProfileDetail {
  customerKey: string
  displayName: string
  phone: string | null
  email: string | null
  types: CustomerType[]
  homeBranchId: string | null
  homeBranchName: string | null
  status: CustomerStatus
  tags: string[]
  notes: string | null
  segment: string | null
  kpis: ICustomerProfileKpis
  creditAccounts: ICustomerCreditAccountSummary[]
  recentSales: ICustomerRecentSale[]
  recentOrders: ICustomerRecentOrder[]
  ids: { userIds: string[]; loyaltyIds: string[]; creditIds: string[] }
}
