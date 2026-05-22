import type { NotificationType } from '@/constants/enums'

export interface INotification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  metadata: Record<string, unknown>
  createdAt: string
}
