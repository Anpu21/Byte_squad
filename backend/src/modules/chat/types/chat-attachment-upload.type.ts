/**
 * Response of `POST /chat/attachments` — the metadata the client then attaches
 * to a realtime chat message (which owns the durable attachment record).
 */
export interface ChatAttachmentUpload {
  url: string;
  publicId: string;
  mimeType: string;
  fileName: string;
  size: number;
}
