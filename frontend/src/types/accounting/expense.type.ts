import type { ExpenseStatus } from '@/constants/enums'

export interface IExpense {
  id: string
  branchId: string
  branch?: { id: string; name: string }
  createdBy: string
  creator?: { id: string; firstName: string; lastName: string }
  category: string
  amount: number
  description: string
  expenseDate: string
  receiptUrl: string | null
  status: ExpenseStatus
  reviewedBy: string | null
  reviewer?: { id: string; firstName: string; lastName: string } | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}
