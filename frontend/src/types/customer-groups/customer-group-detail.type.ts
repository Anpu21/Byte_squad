import type { ICustomerGroupSummary } from '@/types/customer-groups/customer-group-summary.type'
import type { ICustomerGroupMemberView } from '@/types/customer-groups/customer-group-member-view.type'

export interface ICustomerGroupDetail extends ICustomerGroupSummary {
  members: ICustomerGroupMemberView[]
}
