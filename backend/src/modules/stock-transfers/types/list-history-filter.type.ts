import { TransferStatus } from '@common/enums/transfer-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

export interface ListHistoryFilter {
  actorRole: UserRole;
  actorBranchId: string;
  branchId?: string;
  productId?: string;
  from?: string;
  to?: string;
  statuses: TransferStatus[];
  page: number;
  limit: number;
}
