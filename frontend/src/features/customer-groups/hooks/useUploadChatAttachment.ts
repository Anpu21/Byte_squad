import { useMutation } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import type { IChatAttachment } from '@/types'

/** Uploads a single file to the backend (gated to members of `groupId`). */
export function useUploadChatAttachment(groupId: string) {
  return useMutation<IChatAttachment, Error, File>({
    mutationFn: (file: File) => chatService.uploadAttachment(file, groupId),
  })
}
