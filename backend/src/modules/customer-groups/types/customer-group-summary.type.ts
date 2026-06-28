import { CustomerGroupStatus } from '@common/enums/customer-group-status.enum';
import { CustomerGroupMemberRole } from '@common/enums/customer-group-member-role.enum';

/** A group as it appears in the current user's "my groups" list. */
export interface CustomerGroupSummary {
  id: string;
  name: string;
  joinCode: string;
  status: CustomerGroupStatus;
  ownerUserId: string;
  /** The requesting user's role in this group. */
  myRole: CustomerGroupMemberRole;
  memberCount: number;
  createdAt: Date;
}
