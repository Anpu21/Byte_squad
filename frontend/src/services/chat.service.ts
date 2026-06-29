import api from './api'
import realtimeApi from './realtime-api'
import type {
  IApiResponse,
  IChatAttachment,
  IChatConversation,
  IChatMessage,
} from '@/types'

interface HistoryParams {
  limit?: number
  before?: string
}

export const chatService = {
  /**
   * Open (find-or-create) the chat for a customer-group. The realtime service
   * verifies membership against the backend, so a non-member gets 403.
   */
  openGroupConversation: async (
    groupId: string,
  ): Promise<IChatConversation> => {
    const res = await realtimeApi.post<IChatConversation>(
      `/chat/groups/${groupId}/open`,
    )
    return res.data
  },

  /** Newest-first page of history (realtime returns the entity array directly). */
  getHistory: async (
    conversationId: string,
    params?: HistoryParams,
  ): Promise<IChatMessage[]> => {
    const res = await realtimeApi.get<IChatMessage[]>(
      `/chat/conversations/${conversationId}/messages`,
      { params },
    )
    return res.data
  },

  /**
   * Upload a file to the BACKEND (Cloudinary), which returns the metadata the
   * client then attaches to a realtime chat message. Uses the backend `api`
   * (enveloped response), not the realtime client.
   */
  uploadAttachment: async (file: File): Promise<IChatAttachment> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<IApiResponse<IChatAttachment>>(
      '/chat/attachments',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data.data
  },
}
