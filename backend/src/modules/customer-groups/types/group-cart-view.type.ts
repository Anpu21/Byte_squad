import { GroupCartItemView } from '@/modules/customer-groups/types/group-cart-item-view.type';

/** A group's shared cart resolved for display, with rolled-up totals. */
export interface GroupCartView {
  groupId: string;
  items: GroupCartItemView[];
  itemCount: number;
  total: number;
}
