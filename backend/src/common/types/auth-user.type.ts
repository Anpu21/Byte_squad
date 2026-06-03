import { UserRole } from '@common/enums/user-roles.enums';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}
