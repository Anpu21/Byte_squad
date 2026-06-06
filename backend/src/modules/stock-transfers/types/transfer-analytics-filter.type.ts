import { UserRole } from '@common/enums/user-roles.enums';

export interface TransferAnalyticsFilter {
  actorRole: UserRole;
  actorBranchId: string | null;
  /** Admin-only branch scope (source OR destination). */
  branchId?: string;
  from?: Date | null;
  to?: Date | null;
}
