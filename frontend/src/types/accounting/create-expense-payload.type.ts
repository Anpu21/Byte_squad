export interface ICreateExpensePayload {
  branchId?: string
  category: string
  amount: number
  description: string
  expenseDate: string
  receiptUrl?: string
}
