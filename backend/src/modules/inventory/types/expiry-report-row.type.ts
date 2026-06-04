import { ExpirySeverity } from '@inventory/types/expiry-severity.type';

/**
 * One row of the expiry report (Phase C1): a batch with positive quantity and
 * a non-null expiry date, decorated with days-to-expiry and a severity bucket.
 */
export interface ExpiryReportRow {
  batchId: string;
  productId: string;
  productName: string;
  barcode: string;
  branchId: string;
  branchName: string;
  batchNo: string | null;
  expiryDate: string;
  quantity: number;
  daysToExpiry: number;
  severity: ExpirySeverity;
}

export interface ExpiryReport {
  rows: ExpiryReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
