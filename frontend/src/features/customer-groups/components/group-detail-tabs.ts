import {
  LuLayoutGrid as LayoutGrid,
  LuShoppingCart as ShoppingCart,
  LuMessageCircle as MessageCircle,
  LuUsers as Users,
  LuUserPlus as UserPlus,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import { type TabItem } from '@/components/ui'

export type GroupTab =
  | 'overview'
  | 'cart'
  | 'chat'
  | 'members'
  | 'invite'
  | 'analytics'

/** Valid tab keys, for `useTabParam` clamping. */
export const GROUP_TAB_KEYS = [
  'overview',
  'cart',
  'chat',
  'members',
  'invite',
  'analytics',
] as const satisfies readonly GroupTab[]

/**
 * Static sub-nav for the group detail page. Overview is the landing dashboard;
 * the Chat tab's unread `badge` is injected at render from page state.
 */
export const GROUP_TABS: TabItem<GroupTab>[] = [
  { key: 'overview', label: 'Overview', Icon: LayoutGrid },
  { key: 'cart', label: 'Cart', Icon: ShoppingCart },
  { key: 'chat', label: 'Chat', Icon: MessageCircle },
  { key: 'members', label: 'Members', Icon: Users },
  { key: 'invite', label: 'Invite', Icon: UserPlus },
  { key: 'analytics', label: 'Analytics', Icon: TrendingUp },
]
