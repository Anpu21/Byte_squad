import { TransferStatus } from '@common/enums/transfer-status.enum';

/** Numeric aggregates returned by the repository analytics queries. */
export interface TransferAnalyticsRaw {
  byStatus: { status: TransferStatus; count: number }[];
  totalUnits: number;
  avgApprovalHours: number | null;
  avgFulfilmentHours: number | null;
  series: { day: string; count: number }[];
  topProducts: {
    productId: string;
    productName: string;
    transfers: number;
    units: number;
  }[];
}
