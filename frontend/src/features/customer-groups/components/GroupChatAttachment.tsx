import { useState } from 'react'
import { LuFile as FileIcon } from 'react-icons/lu'
import type { IChatAttachment } from '@/types'

const isImage = (mime: string) => mime.startsWith('image/')

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** A chat attachment: inline image, PDF page-1 preview, or a file chip. */
export function GroupChatAttachment({
  attachment,
  mine,
}: {
  attachment: IChatAttachment
  mine: boolean
}) {
  const [thumbFailed, setThumbFailed] = useState(false)

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

  // A document with a derived page-1 preview (PDFs): show it, captioned with the
  // file name, falling back to the chip if the preview can't load.
  if (attachment.thumbnailUrl && !thumbFailed) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block max-w-[12rem] overflow-hidden rounded-lg border border-black/5"
      >
        <img
          src={attachment.thumbnailUrl}
          alt={attachment.fileName}
          onError={() => setThumbFailed(true)}
          className="max-h-48 w-full bg-white object-cover"
        />
        <span
          className={`flex items-center gap-1 px-2 py-1 text-[11px] ${
            mine ? 'bg-white/15 text-white' : 'bg-surface text-text-1'
          }`}
        >
          <FileIcon size={11} className="shrink-0" />
          <span className="truncate">{attachment.fileName}</span>
        </span>
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
