import { useEffect, useState } from 'react'
import { LuMessageCircle as MessageCircle } from 'react-icons/lu'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { GroupChatThread } from '@/features/customer-groups/components/GroupChatThread'
import type { ICustomerGroupMemberView } from '@/types'

/** Tracks the lg breakpoint so we mount the thread once — never in both surfaces. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

interface Props {
  groupId: string
  members: ICustomerGroupMemberView[]
  currentUserId: string
}

/**
 * Group chat surface. On desktop it's a card in the group's right column; on the
 * mobile-first storefront it's a floating button that opens the same thread in a
 * sheet. Exactly one GroupChatThread is mounted (so only one socket/room join).
 */
export function GroupChatPanel({ groupId, members, currentUserId }: Props) {
  const isDesktop = useIsDesktop()
  const [open, setOpen] = useState(false)

  if (isDesktop) {
    return (
      <Card className="flex h-[30rem] flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            Group chat
          </CardTitle>
        </CardHeader>
        <div className="min-h-0 flex-1 p-4">
          <GroupChatThread
            key={groupId}
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
          />
        </div>
      </Card>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open group chat"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg-token transition-opacity hover:opacity-90"
      >
        <MessageCircle size={22} />
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Group chat"
        maxWidth="lg"
      >
        <div className="h-[60vh]">
          <GroupChatThread
            key={groupId}
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
          />
        </div>
      </Modal>
    </>
  )
}
