/** One cashier's aggregates in the salesman-wise sales report. */
export interface SalesmanReportRow {
  cashierId: string;
  cashierName: string;
  /** Non-voided sales in the window. */
  salesCount: number;
  /** Sum of line subtotals (before the bill-level discount). */
  grossTotal: number;
  /** Sum of bill-level discounts. */
  discountTotal: number;
  /** Sum of sale totals — what actually went through the till. */
  netTotal: number;
  voidedCount: number;
}
