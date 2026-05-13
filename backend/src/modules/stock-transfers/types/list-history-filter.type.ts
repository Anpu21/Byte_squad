import { TransferStatus } from '@common/enums/transfer-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

export interface ListHistoryFilter {
  actorRole: UserRole;
  // null for admins (the repo only reads this for non-admin actors).
  actorBranchId: string | null;
  branchId?: string;
  productId?: string;
  from?: string;
  to?: string;
  statuses: TransferStatus[];
  page: number;
  limit: number;
}
