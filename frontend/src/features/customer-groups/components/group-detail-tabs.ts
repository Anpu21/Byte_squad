import {
  LuShoppingCart as ShoppingCart,
  LuMessageCircle as MessageCircle,
  LuUsers as Users,
  LuUserPlus as UserPlus,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import { type TabItem } from '@/components/ui'

export type GroupTab = 'cart' | 'chat' | 'members' | 'invite' | 'analytics'

/** Valid tab keys, for `useTabParam` clamping. */
export const GROUP_TAB_KEYS = [
  'cart',
  'chat',
  'members',
  'invite',
  'analytics',
] as const satisfies readonly GroupTab[]

/**
 * Static sub-nav for the group detail page. The Chat tab's unread `badge` is
 * injected at render from page state; everything else is fixed.
 */
export const GROUP_TABS: TabItem<GroupTab>[] = [
  { key: 'cart', label: 'Cart', Icon: ShoppingCart },
  { key: 'chat', label: 'Chat', Icon: MessageCircle },
  { key: 'members', label: 'Members', Icon: Users },
  { key: 'invite', label: 'Invite', Icon: UserPlus },
  { key: 'analytics', label: 'Analytics', Icon: TrendingUp },
]
