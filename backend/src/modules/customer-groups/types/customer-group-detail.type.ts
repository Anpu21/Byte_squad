import { CustomerGroupSummary } from '@/modules/customer-groups/types/customer-group-summary.type';
import { CustomerGroupMemberView } from '@/modules/customer-groups/types/customer-group-member-view.type';

/** A group plus its full member list — the group detail screen payload. */
export interface CustomerGroupDetail extends CustomerGroupSummary {
  members: CustomerGroupMemberView[];
}
