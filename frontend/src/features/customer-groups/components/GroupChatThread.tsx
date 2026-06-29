import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LuPaperclip as Paperclip,
  LuSend as Send,
  LuX as X,
  LuFile as FileIcon,
} from 'react-icons/lu'
import toast from 'react-hot-toast'
import { useGroupChat } from '@/features/customer-groups/hooks/useGroupChat'
import { useUploadChatAttachment } from '@/features/customer-groups/hooks/useUploadChatAttachment'
import type {
  IChatAttachment,
  IChatMessageView,
  ICustomerGroupMemberView,
} from '@/types'

const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
const MAX_ATTACHMENTS = 5

const isImage = (mime: string) => mime.startsWith('image/')

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  groupId: string
  members: ICustomerGroupMemberView[]
  currentUserId: string
}

/** Message list + composer (text + file uploads). Fills its container's height. */
export function GroupChatThread({ groupId, members, currentUserId }: Props) {
  const { messages, sendMessage, isLoading, isError } = useGroupChat(
    groupId,
    currentUserId,
  )
  const upload = useUploadChatAttachment(groupId)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<IChatAttachment[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const nameFor = useMemo(() => {
    const map = new Map(members.map((m) => [m.userId, m.name]))
    return (id: string) => map.get(id) ?? 'Member'
  }, [members])

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

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
    if (!text.trim() && pending.length === 0) return
    sendMessage(text, pending)
    setText('')
    setPending([])
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
          <MessageBubble
            key={m.tempId ?? m.id}
            message={m}
            mine={m.senderId === currentUserId}
            senderName={nameFor(m.senderId)}
          />
        ))}
      </div>

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
          disabled={upload.isPending || pending.length >= MAX_ATTACHMENTS}
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          placeholder="Message the group…"
          className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() && pending.length === 0}
          className="shrink-0 rounded-lg bg-primary p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  mine,
  senderName,
}: {
  message: IChatMessageView
  mine: boolean
  senderName: string
}) {
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {!mine && (
        <span className="mb-0.5 px-1 text-[11px] font-medium text-text-3">
          {senderName}
        </span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          mine
            ? 'rounded-br-sm bg-primary text-white'
            : 'rounded-bl-sm bg-surface-2 text-text-1'
        } ${message.status === 'sending' ? 'opacity-70' : ''}`}
      >
        {message.attachments.length > 0 && (
          <div className="mb-1 space-y-1.5">
            {message.attachments.map((a) => (
              <Attachment key={a.id ?? a.url} attachment={a} mine={mine} />
            ))}
          </div>
        )}
        {message.body && (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        )}
      </div>
      {message.status === 'failed' && (
        <span className="mt-0.5 px-1 text-[11px] text-danger">
          Failed to send
        </span>
      )}
    </div>
  )
}

function Attachment({
  attachment,
  mine,
}: {
  attachment: IChatAttachment
  mine: boolean
}) {
  if (isImage(attachment.mimeType)) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-h-48 w-auto rounded-lg border border-black/5 object-cover"
        />
      </a>
    )
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
        mine
          ? 'bg-white/15 text-white'
          : 'border border-border bg-surface text-text-1'
      }`}
    >
      <FileIcon size={14} className="shrink-0" />
      <span className="truncate">{attachment.fileName}</span>
      <span className={mine ? 'text-white/70' : 'text-text-3'}>
        {formatSize(attachment.size)}
      </span>
    </a>
  )
}
