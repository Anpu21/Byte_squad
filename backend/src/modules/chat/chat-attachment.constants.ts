/**
 * Chat attachment upload policy. These MUST mirror the realtime service's Zod
 * attachmentSchema (ledgerpro-realtime: src/chat/chat-attachments.constants.ts)
 * so the two edges accept exactly the same files — a client can't upload here a
 * file that chat then rejects. v1: images + PDF + common Office documents.
 */
export const CHAT_ATTACHMENT_MIME_REGEX =
  /^(image\/(jpeg|png|webp|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|text\/(csv|plain))$/;

/** 15 MB — matches MAX_ATTACHMENT_BYTES on the realtime side. */
export const MAX_CHAT_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/** Cloudinary folder for chat uploads (mirrors the ledgerpro/<domain> convention). */
export const CHAT_ATTACHMENT_FOLDER = 'ledgerpro/chat-attachments';
