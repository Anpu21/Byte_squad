/** One supplier line of `GET /purchases/reports/outstanding`. */
export interface IPayablesOutstandingRow {
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

/** One supplier line of `GET /purchases/reports/ageing` (days overdue). */
export interface IPayablesAgeingRow {
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
