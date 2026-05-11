export interface CashierTransactionRow {
  id: string;
  transactionNumber: string;
  total: number;
  itemCount: number;
  cashierName: string;
  branchName?: string | null;
  createdAt: Date;
}
