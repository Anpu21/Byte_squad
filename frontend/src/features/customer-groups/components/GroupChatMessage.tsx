import { useState } from 'react'
import {
  LuPencil as Pencil,
  LuTrash2 as Trash,
  LuFile as FileIcon,
  LuCheck as Check,
  LuX as X,
} from 'react-icons/lu'
import type { IChatAttachment, IChatMessageView } from '@/types'

const isImage = (mime: string) => mime.startsWith('image/')

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  message: IChatMessageView
  mine: boolean
  senderName: string
  seenByLabel: string | null
  onEdit: (messageId: string, body: string) => void
  onDelete: (messageId: string) => void
}

/** One chat message: bubble, attachments, own-message edit/delete, receipts. */
export function GroupChatMessage({
  message,
  mine,
  senderName,
  seenByLabel,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.body)

  const deleted = Boolean(message.deletedAt)
  const canManage = mine && !deleted && message.status === 'sent'

  const saveEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== message.body) onEdit(message.id, trimmed)
    setEditing(false)
  }

  if (deleted) {
    return (
      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
        {!mine && (
          <span className="mb-0.5 px-1 text-[11px] font-medium text-text-3">
            {senderName}
          </span>
        )}
        <div className="max-w-[80%] rounded-2xl border border-dashed border-border px-3 py-2 text-sm italic text-text-3">
          This message was deleted
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {!mine && (
        <span className="mb-0.5 px-1 text-[11px] font-medium text-text-3">
          {senderName}
        </span>
      )}
      <div className="flex max-w-[85%] items-center gap-1.5">
        {canManage && !editing && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setDraft(message.body)
                setEditing(true)
              }}
              aria-label="Edit message"
              className="rounded p-1 text-text-3 hover:bg-surface-2 hover:text-text-1"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              aria-label="Delete message"
              className="rounded p-1 text-text-3 hover:bg-surface-2 hover:text-danger"
            >
              <Trash size={13} />
            </button>
          </div>
        )}
        <div
          className={`max-w-full rounded-2xl px-3 py-2 text-sm ${
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
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    saveEdit()
                  }
                  if (e.key === 'Escape') setEditing(false)
                }}
                rows={2}
                autoFocus
                className="w-56 resize-none rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/60 focus:outline-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  aria-label="Cancel edit"
                  className="rounded p-1 text-white/80 hover:bg-white/15"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  aria-label="Save edit"
                  className="rounded p-1 text-white hover:bg-white/15"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          ) : (
            message.body && (
              <p className="whitespace-pre-wrap break-words">
                {message.body}
                {message.editedAt && (
                  <span
                    className={`ml-1.5 text-[10px] ${
                      mine ? 'text-white/60' : 'text-text-3'
                    }`}
                  >
                    (edited)
                  </span>
                )}
              </p>
            )
          )}
        </div>
      </div>
      {message.status === 'failed' && (
        <span className="mt-0.5 px-1 text-[11px] text-danger">
          Failed to send
        </span>
      )}
      {seenByLabel && (
        <span className="mt-0.5 px-1 text-[11px] text-text-3">
          {seenByLabel}
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
