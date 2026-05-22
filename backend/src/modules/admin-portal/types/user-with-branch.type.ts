import { UserRole } from '@common/enums/user-roles.enums';

export interface UserWithBranch {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}
