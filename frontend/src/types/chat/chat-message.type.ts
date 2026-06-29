import type { IChatAttachment } from '@/types/chat/chat-attachment.type'

/** A chat message as persisted/broadcast by the realtime service. */
export interface IChatMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  attachments: IChatAttachment[]
  createdAt: string
  /** Set when the sender has edited the text. */
  editedAt?: string | null
  /** Set when the message was deleted (body blanked, attachments dropped). */
  deletedAt?: string | null
}

/** Delivery state for an optimistically-rendered outgoing message. */
export type ChatMessageStatus = 'sending' | 'sent' | 'failed'

/** A message as shown in the UI — adds optimistic-send bookkeeping. */
export interface IChatMessageView extends IChatMessage {
  status: ChatMessageStatus
  /** Set while the server id is not yet known (optimistic send). */
  tempId?: string
}
