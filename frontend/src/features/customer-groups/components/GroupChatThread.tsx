import { useRef } from 'react'
import {
  LuPaperclip as Paperclip,
  LuSend as Send,
  LuX as X,
  LuFile as FileIcon,
} from 'react-icons/lu'
import { cn } from '@/lib/utils'
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui'
import { GroupChatMessage } from '@/features/customer-groups/components/GroupChatMessage'
import type { ICustomerGroupMemberView } from '@/types'
import {
  ACCEPT,
  MAX_ATTACHMENTS,
  useGroupChatThread,
} from './useGroupChatThread'

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
export function GroupChatThread(props: Props) {
  const { currentUserId } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const t = useGroupChatThread({ ...props, scrollRef, fileRef })

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-0.5 py-1"
      >
        {t.isLoading && (
          <p className="py-8 text-center text-sm text-text-3">Loading chat…</p>
        )}
        {t.isError && (
          <p className="py-8 text-center text-sm text-danger">
            Couldn't open the group chat.
          </p>
        )}
        {!t.isLoading && !t.isError && t.messages.length === 0 && (
          <p className="py-8 text-center text-sm text-text-3">
            No messages yet — say hello 👋
          </p>
        )}
        {t.messages.map((m) => (
          <GroupChatMessage
            key={m.tempId ?? m.id}
            message={m}
            mine={m.senderId === currentUserId}
            senderName={t.nameFor(m.senderId)}
            seenByLabel={m.id === t.lastMineId ? t.seenByLabel : null}
            onEdit={t.sendEdit}
            onDelete={t.handleDelete}
          />
        ))}
      </div>

      {t.typingLabel && (
        <p
          className="px-1 pt-1 text-[11px] italic text-text-3"
          aria-live="polite"
        >
          {t.typingLabel}
        </p>
      )}

      {t.pending.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {t.pending.map((a, i) => (
            <span
              key={a.publicId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text-2"
            >
              <FileIcon size={12} className="text-text-3" />
              <span className="max-w-[8rem] truncate">{a.fileName}</span>
              <button
                type="button"
                onClick={() =>
                  t.setPending((p) => p.filter((_, idx) => idx !== i))
                }
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
          onChange={(e) => void t.pickFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={
            t.isRevoked || t.uploadPending || t.pending.length >= MAX_ATTACHMENTS
          }
          className="shrink-0 rounded-lg p-2 text-text-3 transition-colors hover:bg-surface-2 hover:text-text-1 disabled:opacity-40"
          aria-label="Attach a file"
        >
          {t.uploadPending ? (
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>
        <textarea
          value={t.text}
          onChange={(e) => {
            t.setText(e.target.value)
            t.notifyTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              t.submit()
            }
          }}
          rows={1}
          disabled={t.isRevoked}
          placeholder={
            t.isRevoked
              ? "You're no longer a member of this group"
              : 'Message the group…'
          }
          className={cn(
            FIELD_SHELL,
            FIELD_BORDER,
            'max-h-28 min-h-[2.5rem] flex-1 resize-none px-3 py-2',
          )}
        />
        <button
          type="button"
          onClick={t.submit}
          disabled={t.isRevoked || (!t.text.trim() && t.pending.length === 0)}
          className="shrink-0 rounded-lg bg-primary p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
