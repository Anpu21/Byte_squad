import { TransferStatus } from '@common/enums/transfer-status.enum';

export interface ListMineFilter {
  // null means "across all branches" — used when an admin (who has no branch
  // of their own) lists transfers system-wide.
  branchId: string | null;
  status?: TransferStatus;
  page: number;
  limit: number;
}
