import { TransferStatus } from '@common/enums/transfer-status.enum';

export interface TransferAnalyticsKpis {
  total: number;
  pending: number;
  approved: number;
  inTransit: number;
  completed: number;
  rejectedCancelled: number;
  /** Units actually moved (sum of approved quantity on completed transfers). */
  totalUnits: number;
  /** Mean hours from request to approval (null when none reviewed). */
  avgApprovalHours: number | null;
  /** Mean hours from ship to receive (null when none completed). */
  avgFulfilmentHours: number | null;
}

export interface TransferAnalyticsResponse {
  from: string | null;
  to: string | null;
  /** Resolved branch scope: a branch id, or null for all branches (admin). */
  branchId: string | null;
  kpis: TransferAnalyticsKpis;
  byStatus: { status: TransferStatus; count: number }[];
  series: { day: string; count: number }[];
  topProducts: {
    productId: string;
    productName: string;
    transfers: number;
    units: number;
  }[];
}
