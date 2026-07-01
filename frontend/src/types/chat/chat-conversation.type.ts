/** A chat conversation. For group chat, `referenceId` is the customer-group id. */
export interface IChatConversation {
  id: string
  type: 'direct' | 'group' | 'support'
  title: string | null
  referenceId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}
