/** One supplier line on the payables-outstanding report. */
export interface PayablesOutstandingRow {
  supplierId: string;
  supplierName: string;
  openingBalance: number;
  openingSettled: number;
  openingRemaining: number;
  billsTotal: number;
  billsPaid: number;
  billsOutstanding: number;
  totalOutstanding: number;
}

/** One supplier line on the payables-ageing report (days overdue). */
export interface PayablesAgeingRow {
  supplierId: string;
  supplierName: string;
  /** Not yet due. */
  current: number;
  d1to30: number;
  d31to60: number;
  d61to90: number;
  d90plus: number;
  total: number;
}
