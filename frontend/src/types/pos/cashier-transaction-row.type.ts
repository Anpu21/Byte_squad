/**
 * Trimmed sale row returned by the cashier-scoped and admin-scoped
 * transaction-listing endpoints. The backend column type is `Date`; over
 * HTTP this serializes to an ISO string.
 *
 * Mirrors `backend/src/modules/pos/types/cashier-transaction-row.type.ts`.
 */
export interface ICashierTransactionRow {
  id: string;
  transactionNumber: string;
  total: number;
  itemCount: number;
  cashierName: string;
  branchName?: string | null;
  createdAt: string;
}
