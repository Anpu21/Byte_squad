import type { CustomerStatus } from './customer-status.type'
import type { CustomerType } from './customer-type.type'

/** One row in the unified customers directory (Phase 1). */
export interface ICustomerSummaryRow {
  customerKey: string
  displayName: string
  phone: string | null
  email: string | null
  /** Which source records this stitched customer is made of. */
  types: CustomerType[]
  homeBranchId: string | null
  homeBranchName: string | null
  loyaltyPoints: number
  creditBalance: number
  ordersCount: number
  lifetimeSpend: number
  lastSeenAt: string | null
  tags: string[]
  status: CustomerStatus
}
