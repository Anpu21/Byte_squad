import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import toast from 'react-hot-toast'
import { useGroupChat } from '@/features/customer-groups/hooks/useGroupChat'
import { useChatPresence } from '@/features/customer-groups/hooks/useChatPresence'
import { useUploadChatAttachment } from '@/features/customer-groups/hooks/useUploadChatAttachment'
import { countUnread } from '@/features/customer-groups/lib/group-chat-unread'
import { useConfirm } from '@/hooks/useConfirm'
import type { IChatAttachment, ICustomerGroupMemberView } from '@/types'

export const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
export const MAX_ATTACHMENTS = 5

interface UseGroupChatThreadArgs {
  groupId: string
  members: ICustomerGroupMemberView[]
  currentUserId: string
  isActive: boolean
  onUnreadChange: (count: number) => void
  scrollRef: RefObject<HTMLDivElement | null>
  fileRef: RefObject<HTMLInputElement | null>
}

/**
 * Group-chat thread state: message history, presence (typing + read receipts),
 * unread counting while hidden, attachment uploads, and send/edit/delete.
 */
export function useGroupChatThread({
  groupId,
  members,
  currentUserId,
  isActive,
  onUnreadChange,
  scrollRef,
  fileRef,
}: UseGroupChatThreadArgs) {
  const {
    conversationId,
    messages,
    sendMessage,
    sendEdit,
    sendDelete,
    isLoading,
    isError,
    isRevoked,
  } = useGroupChat(groupId, currentUserId)
  const { typingUserIds, readState, notifyTyping, markRead } = useChatPresence(
    conversationId,
    currentUserId,
  )
  const confirm = useConfirm()
  const upload = useUploadChatAttachment(groupId)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<IChatAttachment[]>([])
  // Count of messages already "seen"; null until history first loads.
  const seenCountRef = useRef<number | null>(null)

  const nameFor = useMemo(() => {
    const map = new Map(members.map((m) => [m.userId, m.name]))
    return (id: string) => map.get(id) ?? 'Member'
  }, [members])

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, scrollRef])

  // Read receipts + unread badge. The history present when the user arrives is
  // the "seen" baseline, so it never counts as unread. While the tab is visible
  // we mark the thread read and keep the badge at zero; while it's hidden we
  // count new messages from other members.
  useEffect(() => {
    if (isLoading) return
    const seen = seenCountRef.current ?? messages.length
    if (isActive) {
      if (!isRevoked && messages.length > 0) markRead()
      seenCountRef.current = messages.length
      onUnreadChange(0)
      return
    }
    seenCountRef.current = seen
    onUnreadChange(countUnread(messages, currentUserId, seen))
  }, [
    isActive,
    isLoading,
    messages,
    isRevoked,
    currentUserId,
    markRead,
    onUnreadChange,
  ])

  // The most recent delivered message the current user authored — read receipts
  // ("seen by …") attach to it.
  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.senderId === currentUserId && m.status === 'sent') return m.id
    }
    return null
  }, [messages, currentUserId])

  const seenByLabel = useMemo(() => {
    if (!lastMineId) return null
    const msg = messages.find((m) => m.id === lastMineId)
    if (!msg) return null
    const names = members
      .filter((m) => m.userId !== currentUserId)
      .filter((m) => {
        const at = readState[m.userId]
        return at ? Date.parse(at) >= Date.parse(msg.createdAt) : false
      })
      .map((m) => m.name)
    if (names.length === 0) return null
    if (names.length === 1) return `Seen by ${names[0]}`
    if (names.length === 2) return `Seen by ${names[0]} and ${names[1]}`
    return `Seen by ${names.length} members`
  }, [lastMineId, messages, members, readState, currentUserId])

  const typingLabel = useMemo(() => {
    const names = typingUserIds.map(nameFor)
    if (names.length === 0) return null
    if (names.length === 1) return `${names[0]} is typing…`
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
    return 'Several people are typing…'
  }, [typingUserIds, nameFor])

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_ATTACHMENTS - pending.length
    if (room <= 0) {
      toast.error(`Up to ${MAX_ATTACHMENTS} files per message`)
      return
    }
    for (const file of Array.from(files).slice(0, room)) {
      try {
        const att = await upload.mutateAsync(file)
        setPending((p) => [...p, att])
      } catch {
        toast.error(`Couldn't upload ${file.name}`)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = () => {
    if (isRevoked || (!text.trim() && pending.length === 0)) return
    sendMessage(text, pending)
    setText('')
    setPending([])
  }

  const handleDelete = async (messageId: string) => {
    const ok = await confirm({
      title: 'Delete message?',
      body: 'This removes the message for everyone in the group.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (ok) sendDelete(messageId)
  }

  return {
    messages,
    isLoading,
    isError,
    isRevoked,
    nameFor,
    lastMineId,
    seenByLabel,
    typingLabel,
    text,
    setText,
    pending,
    setPending,
    uploadPending: upload.isPending,
    sendEdit,
    notifyTyping,
    pickFiles,
    submit,
    handleDelete,
  }
}
