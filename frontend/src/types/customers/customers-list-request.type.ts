import type { CustomerStatus } from './customer-status.type'
import type { CustomerType } from './customer-type.type'

export interface ICustomersListRequest {
  search?: string
  type?: CustomerType | 'all'
  segment?: string
  tag?: string
  status?: CustomerStatus
  /** Admin-only cross-branch filter; managers are pinned to their branch. */
  branchId?: string
  page?: number
  limit?: number
  sort?: string
}
