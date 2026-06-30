import type { IGroupCartItemView } from '@/types/customer-groups/group-cart-item-view.type'

export interface IGroupCartView {
  groupId: string
  items: IGroupCartItemView[]
  itemCount: number
  total: number
}
