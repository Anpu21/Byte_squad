import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import { getChatSocket } from '@/services/chat-socket.service'
import { queryKeys } from '@/lib/queryKeys'

interface UseChatPresence {
  /** Other participants currently typing (never includes the current user). */
  typingUserIds: string[]
  /** userId → their last-read timestamp (ISO); seeded, then kept live. */
  readState: Record<string, string>
  /** Throttled "I'm typing" ping — safe to call on every keystroke. */
  notifyTyping: () => void
  /** Tell the room the current user has read up to now. */
  markRead: () => void
}

const TYPING_TTL_MS = 3000
const TYPING_THROTTLE_MS = 2000

/**
 * Typing indicators + read receipts for a conversation, layered on the shared
 * `/chat` socket. The server broadcasts `chat:typing` / `chat:read` to the room
 * EXCLUDING the sender, so neither set ever contains the current user. Read
 * cursors are seeded from the participants endpoint and merged with live
 * `chat:read` events at render — server data is never copied into state inside
 * an effect (only in async socket callbacks).
 */
export function useChatPresence(
  conversationId: string | undefined,
  currentUserId: string,
): UseChatPresence {
  const participantsQuery = useQuery({
    queryKey: queryKeys.chat.participants(conversationId ?? ''),
    queryFn: () => chatService.getParticipants(conversationId as string),
    enabled: Boolean(conversationId),
    staleTime: 30_000,
    retry: false,
  })

  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [liveReads, setLiveReads] = useState<Record<string, string>>({})
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  useEffect(() => {
    if (!conversationId) return
    const socket = getChatSocket()
    if (!socket.connected) socket.connect()
    const timers = typingTimers.current

    const onTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId) return
      if (data.userId === currentUserId) return
      setTypingUserIds((prev) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId],
      )
      const existing = timers.get(data.userId)
      if (existing) clearTimeout(existing)
      timers.set(
        data.userId,
        setTimeout(() => {
          setTypingUserIds((prev) => prev.filter((id) => id !== data.userId))
          timers.delete(data.userId)
        }, TYPING_TTL_MS),
      )
    }
    socket.on('chat:typing', onTyping)

    const onRead = (data: {
      conversationId: string
      userId: string
      lastReadAt: string
    }) => {
      if (data.conversationId !== conversationId) return
      setLiveReads((prev) => ({ ...prev, [data.userId]: data.lastReadAt }))
    }
    socket.on('chat:read', onRead)

    return () => {
      socket.off('chat:typing', onTyping)
      socket.off('chat:read', onRead)
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      setTypingUserIds([])
    }
  }, [conversationId, currentUserId])

  // Seed (participants' lastReadAt) overlaid with live chat:read events.
  const readState = useMemo<Record<string, string>>(() => {
    const seed: Record<string, string> = {}
    for (const p of participantsQuery.data ?? []) {
      if (p.lastReadAt) seed[p.userId] = p.lastReadAt
    }
    return { ...seed, ...liveReads }
  }, [participantsQuery.data, liveReads])

  const lastTypingEmit = useRef(0)
  const notifyTyping = useCallback(() => {
    if (!conversationId) return
    const now = Date.now()
    if (now - lastTypingEmit.current < TYPING_THROTTLE_MS) return
    lastTypingEmit.current = now
    getChatSocket().emit('chat:typing', { conversationId })
  }, [conversationId])

  const markRead = useCallback(() => {
    if (!conversationId) return
    getChatSocket().emit('chat:read', { conversationId })
  }, [conversationId])

  return { typingUserIds, readState, notifyTyping, markRead }
}
