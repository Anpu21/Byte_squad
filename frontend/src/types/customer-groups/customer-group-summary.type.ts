import type { CustomerGroupStatus } from '@/types/customer-groups/customer-group-status.type'
import type { CustomerGroupMemberRole } from '@/types/customer-groups/customer-group-member-role.type'

export interface ICustomerGroupSummary {
  id: string
  name: string
  joinCode: string
  status: CustomerGroupStatus
  ownerUserId: string
  /** The current user's role in this group. */
  myRole: CustomerGroupMemberRole
  memberCount: number
  createdAt: string
}
