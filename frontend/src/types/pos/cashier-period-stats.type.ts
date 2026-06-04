/**
 * Per-period totals (today / month / year) used inside the cashier
 * transactions summary. Mirrors
 * `backend/src/modules/pos/types/cashier-period-stats.type.ts`.
 */
export interface ICashierPeriodStats {
  totalSales: number;
  transactionCount: number;
}
