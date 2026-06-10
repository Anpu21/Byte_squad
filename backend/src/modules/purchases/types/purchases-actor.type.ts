import type { UserRole } from '@common/enums/user-roles.enums';

/** JWT actor shape used across the purchases module (from @CurrentUser). */
export interface PurchasesActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}
