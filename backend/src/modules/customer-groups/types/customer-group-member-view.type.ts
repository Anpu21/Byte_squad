import { CustomerGroupMemberRole } from '@common/enums/customer-group-member-role.enum';

/** A group member enriched with display fields for the members list. */
export interface CustomerGroupMemberView {
  userId: string;
  name: string;
  email: string;
  role: CustomerGroupMemberRole;
  joinedAt: Date;
}
