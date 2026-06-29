import { useMutation } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import type { IChatAttachment } from '@/types'

/** Uploads a single file to the backend and returns the attachment metadata. */
export function useUploadChatAttachment() {
  return useMutation<IChatAttachment, Error, File>({
    mutationFn: (file: File) => chatService.uploadAttachment(file),
  })
}
