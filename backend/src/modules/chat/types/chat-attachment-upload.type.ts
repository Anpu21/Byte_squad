/**
 * Response of `POST /chat/attachments` — the metadata the client then attaches
 * to a realtime chat message (which owns the durable attachment record).
 */
export interface ChatAttachmentUpload {
  url: string;
  publicId: string;
  /** Page-1 preview (JPG) for documents that support it (PDFs); else absent. */
  thumbnailUrl?: string;
  mimeType: string;
  fileName: string;
  size: number;
}
