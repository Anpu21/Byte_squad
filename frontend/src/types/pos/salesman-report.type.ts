/** One cashier's aggregates in the salesman-wise sales report. */
export interface ISalesmanReportRow {
    cashierId: string;
    cashierName: string;
    salesCount: number;
    /** Sum of line subtotals (before the bill-level discount). */
    grossTotal: number;
    /** Sum of bill-level discounts. */
    discountTotal: number;
    /** Sum of sale totals — what actually went through the till. */
    netTotal: number;
    voidedCount: number;
}

/** Response of `GET /pos/reports/salesman` (resolved window echoed back). */
export interface ISalesmanReportResponse {
    startDate: string;
    endDate: string;
    rows: ISalesmanReportRow[];
}

export interface ISalesmanReportParams {
    startDate?: string;
    endDate?: string;
    branchId?: string;
}
