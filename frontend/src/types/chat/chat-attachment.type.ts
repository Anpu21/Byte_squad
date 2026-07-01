/**
 * A file attached to a chat message. The backend upload endpoint returns this
 * shape (minus `id`); the realtime service echoes it back with an `id` once
 * persisted. Images preview inline; documents with a `thumbnailUrl` (PDFs) show
 * a page-1 preview, and everything else renders as a file chip.
 */
export interface IChatAttachment {
  id?: string
  url: string
  publicId: string
  mimeType: string
  fileName: string
  size: number
  /** Page-1 preview for documents (PDFs); absent otherwise. */
  thumbnailUrl?: string | null
}
