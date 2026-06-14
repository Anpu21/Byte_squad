import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';

/**
 * Minimal actor shape for branch-scoped authorization — the subset of the JWT
 * user (see current-user.decorator) that scoping decisions depend on.
 */
export interface BranchActor {
  role: UserRole;
  branchId: string | null;
}

export function isAdmin(actor: BranchActor): boolean {
  return actor.role === UserRole.ADMIN;
}

/**
 * The branch ids a non-admin actor may read. Admins return `null` — meaning
 * "all branches, no filter". A non-admin is limited to their own branch (and
 * sees nothing if, anomalously, they have no branch).
 */
export function allowedBranchIds(actor: BranchActor): string[] | null {
  if (isAdmin(actor)) return null;
  return actor.branchId ? [actor.branchId] : [];
}

/**
 * Guard single-branch access: admins pass; everyone else may only touch their
 * own branch, else `ForbiddenException`. Multi-tenant safety (blaxx nestjs-08)
 * is enforced here in the service layer, not left to the controller's @Roles.
 */
export function assertBranchScope(actor: BranchActor, branchId: string): void {
  if (isAdmin(actor)) return;
  if (actor.branchId !== branchId) {
    throw new ForbiddenException('Resource is outside your branch scope');
  }
}
