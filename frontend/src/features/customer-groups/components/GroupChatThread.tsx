import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LuPaperclip as Paperclip,
  LuSend as Send,
  LuX as X,
  LuFile as FileIcon,
} from 'react-icons/lu'
import toast from 'react-hot-toast'
import { useGroupChat } from '@/features/customer-groups/hooks/useGroupChat'
import { useChatPresence } from '@/features/customer-groups/hooks/useChatPresence'
import { useUploadChatAttachment } from '@/features/customer-groups/hooks/useUploadChatAttachment'
import { GroupChatMessage } from '@/features/customer-groups/components/GroupChatMessage'
import { countUnread } from '@/features/customer-groups/lib/group-chat-unread'
import { useConfirm } from '@/hooks/useConfirm'
import type { IChatAttachment, ICustomerGroupMemberView } from '@/types'

const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
const MAX_ATTACHMENTS = 5

interface Props {
  groupId: string
  members: ICustomerGroupMemberView[]
  currentUserId: string
  /** Whether the Chat tab is visible — gates read receipts + unread counting. */
  isActive: boolean
  /** Reports unread (new non-own messages received while hidden) to the page. */
  onUnreadChange: (count: number) => void
}

/** Message list + composer (text + file uploads). Fills its container's height. */
export function GroupChatThread({
  groupId,
  members,
  currentUserId,
  isActive,
  onUnreadChange,
}: Props) {
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
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
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
  }, [messages])

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

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-0.5 py-1"
      >
        {isLoading && (
          <p className="py-8 text-center text-sm text-text-3">Loading chat…</p>
        )}
        {isError && (
          <p className="py-8 text-center text-sm text-danger">
            Couldn't open the group chat.
          </p>
        )}
        {!isLoading && !isError && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-text-3">
            No messages yet — say hello 👋
          </p>
        )}
        {messages.map((m) => (
          <GroupChatMessage
            key={m.tempId ?? m.id}
            message={m}
            mine={m.senderId === currentUserId}
            senderName={nameFor(m.senderId)}
            seenByLabel={m.id === lastMineId ? seenByLabel : null}
            onEdit={sendEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {typingLabel && (
        <p
          className="px-1 pt-1 text-[11px] italic text-text-3"
          aria-live="polite"
        >
          {typingLabel}
        </p>
      )}

      {pending.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {pending.map((a, i) => (
            <span
              key={a.publicId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text-2"
            >
              <FileIcon size={12} className="text-text-3" />
              <span className="max-w-[8rem] truncate">{a.fileName}</span>
              <button
                type="button"
                onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${a.fileName}`}
                className="text-text-3 hover:text-danger"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-end gap-2 border-t border-border pt-3">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => void pickFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={
            isRevoked || upload.isPending || pending.length >= MAX_ATTACHMENTS
          }
          className="shrink-0 rounded-lg p-2 text-text-3 transition-colors hover:bg-surface-2 hover:text-text-1 disabled:opacity-40"
          aria-label="Attach a file"
        >
          {upload.isPending ? (
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            notifyTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          disabled={isRevoked}
          placeholder={
            isRevoked
              ? "You're no longer a member of this group"
              : 'Message the group…'
          }
          className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isRevoked || (!text.trim() && pending.length === 0)}
          className="shrink-0 rounded-lg bg-primary p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
