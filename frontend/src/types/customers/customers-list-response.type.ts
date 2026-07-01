import type { ICustomerSummaryRow } from './customer-summary-row.type'

export interface ICustomersListResponse {
  items: ICustomerSummaryRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}
