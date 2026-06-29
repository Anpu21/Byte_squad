import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import { getChatSocket } from '@/services/chat-socket.service'
import { queryKeys } from '@/lib/queryKeys'
import type {
  IChatAttachment,
  IChatMessage,
  IChatMessageView,
} from '@/types'

interface UseGroupChat {
  conversationId: string | undefined
  messages: IChatMessageView[]
  sendMessage: (body: string, attachments?: IChatAttachment[]) => void
  isLoading: boolean
  isError: boolean
}

/**
 * Live group chat for a customer-group. Opens (find-or-creates) the group's
 * conversation, loads history, joins the socket room, and merges live + optimistic
 * messages with history. History stays owned by TanStack Query; only live/optimistic
 * messages live in local state, and the two are merged (deduped by id) at render —
 * so we never copy server data into state inside an effect.
 *
 * The hosting component is keyed by groupId, so switching groups remounts this
 * hook with fresh state (no manual reset).
 */
export function useGroupChat(
  groupId: string | undefined,
  currentUserId: string,
): UseGroupChat {
  // 1) Open (find-or-create) the group conversation — its id is stable per group.
  const openQuery = useQuery({
    queryKey: queryKeys.chat.conversation(groupId ?? ''),
    queryFn: () => chatService.openGroupConversation(groupId as string),
    enabled: Boolean(groupId),
    staleTime: Infinity,
    retry: false,
  })
  const conversationId = openQuery.data?.id

  // 2) Initial history (newest-first from the server).
  const historyQuery = useQuery({
    queryKey: queryKeys.chat.history(conversationId ?? ''),
    queryFn: () =>
      chatService.getHistory(conversationId as string, { limit: 50 }),
    enabled: Boolean(conversationId),
    staleTime: 30_000,
    retry: false,
  })

  // Live + optimistic messages only (history is merged in at render).
  const [liveMessages, setLiveMessages] = useState<IChatMessageView[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  // 3) Join the conversation room + receive live messages. No setState runs in
  // the effect body — only in the (async) socket/ack callbacks.
  useEffect(() => {
    if (!conversationId) return
    const socket = getChatSocket()
    if (!socket.connected) socket.connect()

    const join = () => socket.emit('chat:join', { conversationId })
    if (socket.connected) join()
    socket.on('connect', join)

    const onMessage = (msg: IChatMessage) => {
      if (msg.conversationId !== conversationId) return
      if (seenIds.current.has(msg.id)) return
      seenIds.current.add(msg.id)
      setLiveMessages((prev) => {
        // Reconcile our own optimistic echo (arrived before its ack).
        const i = prev.findIndex(
          (m) =>
            m.status === 'sending' &&
            m.senderId === msg.senderId &&
            m.body === msg.body &&
            m.attachments.length === msg.attachments.length,
        )
        if (i !== -1) {
          const next = [...prev]
          next[i] = { ...msg, status: 'sent' }
          return next
        }
        return [...prev, { ...msg, status: 'sent' }]
      })
    }
    socket.on('chat:message', onMessage)

    return () => {
      socket.off('connect', join)
      socket.off('chat:message', onMessage)
    }
  }, [conversationId])

  // History (oldest-first) + live, deduped by id. A live message that later
  // appears in refetched history is shown once (from history).
  const messages = useMemo<IChatMessageView[]>(() => {
    const history = (historyQuery.data ?? [])
      .slice()
      .reverse()
      .map((m) => ({ ...m, status: 'sent' as const }))
    const historyIds = new Set(history.map((m) => m.id))
    const extra = liveMessages.filter((m) => !historyIds.has(m.id))
    return [...history, ...extra]
  }, [historyQuery.data, liveMessages])

  const sendMessage = useCallback(
    (body: string, attachments: IChatAttachment[] = []) => {
      if (!conversationId) return
      const trimmed = body.trim()
      if (!trimmed && attachments.length === 0) return

      const tempId = `temp-${crypto.randomUUID()}`
      const optimistic: IChatMessageView = {
        id: tempId,
        tempId,
        conversationId,
        senderId: currentUserId,
        body: trimmed,
        attachments,
        createdAt: new Date().toISOString(),
        status: 'sending',
      }
      setLiveMessages((prev) => [...prev, optimistic])

      getChatSocket().emit(
        'chat:message',
        {
          conversationId,
          body: trimmed,
          attachments: attachments.map((a) => ({
            url: a.url,
            publicId: a.publicId,
            mimeType: a.mimeType,
            fileName: a.fileName,
            size: a.size,
          })),
        },
        (ack: { ok?: boolean; id?: string }) => {
          setLiveMessages((prev) =>
            prev.map((m) => {
              if (m.tempId !== tempId) return m
              if (ack?.ok && ack.id) {
                seenIds.current.add(ack.id)
                return { ...m, id: ack.id, status: 'sent' }
              }
              return { ...m, status: 'failed' }
            }),
          )
        },
      )
    },
    [conversationId, currentUserId],
  )

  return {
    conversationId,
    messages,
    sendMessage,
    isLoading: openQuery.isLoading || historyQuery.isLoading,
    isError: openQuery.isError,
  }
}
