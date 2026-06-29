import { LuMessageCircle as MessageCircle } from 'react-icons/lu'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { GroupChatThread } from '@/features/customer-groups/components/GroupChatThread'
import type { ICustomerGroupMemberView } from '@/types'

interface Props {
  groupId: string
  members: ICustomerGroupMemberView[]
  currentUserId: string
  /** Whether the Chat tab is the active tab — drives read receipts + unread. */
  isActive: boolean
  /** Reports the current unread count up to the page (for the tab badge). */
  onUnreadChange: (count: number) => void
}

/**
 * Group chat tab body. Renders a single `GroupChatThread` (one socket/room join)
 * sized to fill the tab. The page keeps this mounted while the Chat tab is hidden
 * so it stays connected and can surface an unread badge; `isActive` tells the
 * thread when it's actually visible.
 */
export function GroupChatPanel({
  groupId,
  members,
  currentUserId,
  isActive,
  onUnreadChange,
}: Props) {
  return (
    <Card className="flex h-[60vh] min-h-[26rem] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          Group chat
        </CardTitle>
      </CardHeader>
      <div className="min-h-0 flex-1 px-4 pb-4">
        <GroupChatThread
          key={groupId}
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
          isActive={isActive}
          onUnreadChange={onUnreadChange}
        />
      </div>
    </Card>
  )
}
