export interface ListLedgerOptions {
  branchId: string;
  entryType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}
