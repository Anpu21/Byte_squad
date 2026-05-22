export interface ICashierTransactionRow {
  id: string
  transactionNumber: string
  total: number
  itemCount: number
  cashierName: string
  branchName?: string | null
  createdAt: string
}
