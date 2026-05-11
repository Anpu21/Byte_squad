import type { ExpenseStatus } from '@/constants/enums'

export interface IGetExpensesParams {
  branchId?: string
  status?: ExpenseStatus
  search?: string
}
