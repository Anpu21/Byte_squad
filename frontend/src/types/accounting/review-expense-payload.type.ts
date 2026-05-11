import type { ExpenseStatus } from '@/constants/enums'

export interface IReviewExpensePayload {
  status: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED
  note?: string
}
