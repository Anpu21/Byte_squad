export interface ListLedgerOptions {
  // null means "across all branches" — admins see cross-branch totals.
  branchId: string | null;
  entryType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}
