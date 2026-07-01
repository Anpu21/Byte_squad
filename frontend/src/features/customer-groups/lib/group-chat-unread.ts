import type { IChatMessageView } from '@/types'

/**
 * Count messages from `fromIndex` onward that were NOT sent by the current user
 * — the unread badge for the Chat tab while it's hidden. `fromIndex` is the
 * "already seen" baseline (message count when the tab was last visible).
 */
export function countUnread(
  messages: IChatMessageView[],
  currentUserId: string,
  fromIndex: number,
): number {
  let unread = 0
  for (let i = Math.max(0, fromIndex); i < messages.length; i++) {
    if (messages[i].senderId !== currentUserId) unread++
  }
  return unread
}
