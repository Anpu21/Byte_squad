import type { CustomerGroupMemberRole } from '@/types/customer-groups/customer-group-member-role.type'

export interface ICustomerGroupMemberView {
  userId: string
  name: string
  email: string
  role: CustomerGroupMemberRole
  joinedAt: string
}
