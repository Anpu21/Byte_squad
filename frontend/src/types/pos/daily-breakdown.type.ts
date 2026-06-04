/**
 * Per-day rollup the dashboard endpoints use to power the 7-day sparkline
 * and the daily-breakdown bars. Backend shape lives at
 * `backend/src/modules/pos/types/daily-breakdown.type.ts`.
 */
export interface IDailyBreakdown {
  date: string;
  totalSales: number;
  transactionCount: number;
}
