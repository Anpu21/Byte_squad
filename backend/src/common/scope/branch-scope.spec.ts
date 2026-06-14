import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import {
  allowedBranchIds,
  assertBranchScope,
  isAdmin,
  type BranchActor,
} from './branch-scope';

const admin: BranchActor = { role: UserRole.ADMIN, branchId: null };
const manager: BranchActor = { role: UserRole.MANAGER, branchId: 'b1' };
const cashier: BranchActor = { role: UserRole.CASHIER, branchId: 'b1' };

describe('branch-scope', () => {
  describe('isAdmin', () => {
    it('is true only for admins', () => {
      expect(isAdmin(admin)).toBe(true);
      expect(isAdmin(manager)).toBe(false);
    });
  });

  describe('allowedBranchIds', () => {
    it('returns null (all branches) for admins', () => {
      expect(allowedBranchIds(admin)).toBeNull();
    });
    it('limits a non-admin to their own branch', () => {
      expect(allowedBranchIds(manager)).toEqual(['b1']);
      expect(allowedBranchIds(cashier)).toEqual(['b1']);
    });
    it('returns an empty set for a non-admin with no branch', () => {
      expect(
        allowedBranchIds({ role: UserRole.MANAGER, branchId: null }),
      ).toEqual([]);
    });
  });

  describe('assertBranchScope', () => {
    it('lets an admin touch any branch', () => {
      expect(() => assertBranchScope(admin, 'any')).not.toThrow();
    });
    it('lets a non-admin touch their own branch', () => {
      expect(() => assertBranchScope(manager, 'b1')).not.toThrow();
    });
    it('forbids a non-admin touching another branch', () => {
      expect(() => assertBranchScope(manager, 'b2')).toThrow(
        ForbiddenException,
      );
    });
  });
});
