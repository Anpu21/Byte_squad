import { TransferStatus } from '@common/enums/transfer-status.enum';

export interface ListIncomingFilter {
  // null means "across all branches" — used when an admin lists incoming
  // transfers system-wide.
  branchId: string | null;
  status?: TransferStatus;
  page: number;
  limit: number;
}
