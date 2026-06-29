/**
 * A file attached to a chat message. The backend upload endpoint returns this
 * shape (minus `id`); the realtime service echoes it back with an `id` once
 * persisted. Images preview inline; everything else renders as a file chip.
 */
export interface IChatAttachment {
  id?: string
  url: string
  publicId: string
  mimeType: string
  fileName: string
  size: number
}
