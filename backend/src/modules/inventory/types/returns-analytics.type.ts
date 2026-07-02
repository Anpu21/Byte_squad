/** Headline totals for the returns dashboard, within the reported window. */
export interface ReturnsTotals {
  returnsCount: number;
  totalRefunded: number;
  restockedValue: number;
  /** Damaged units logged against returns (sold-unit qty), audit-only stock. */
  damagedQty: number;
}

export interface ReturnsByBranchRow {
  branchId: string;
  branchName: string;
  returnsCount: number;
  totalRefunded: number;
}

export interface ReturnsByCashierRow {
  cashierId: string;
  cashierName: string;
  returnsCount: number;
  totalRefunded: number;
}

export interface ReturnsTrendPoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  returnsCount: number;
  totalRefunded: number;
}

export interface ReturnsAnalytics {
  range: { startDate: string; endDate: string };
  totals: ReturnsTotals;
  byBranch: ReturnsByBranchRow[];
  byCashier: ReturnsByCashierRow[];
  trend: ReturnsTrendPoint[];
}
