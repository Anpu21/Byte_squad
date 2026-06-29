import { io, type Socket } from 'socket.io-client'
import { store } from '@/store'
import { selectAuthToken } from '@/store/selectors/auth'

/**
 * Single shared socket for the `/chat` namespace on the realtime service —
 * separate from the `/notifications` socket. Lazy-created and reused. The
 * callback-form `auth` re-reads the current token on every (re)connect, so a
 * refreshed token is picked up without recreating the socket.
 */
let chatSocket: Socket | null = null

const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL ?? ''

export function getChatSocket(): Socket {
  if (!chatSocket) {
    chatSocket = io(`${SOCKET_BASE}/chat`, {
      auth: (cb) => cb({ token: selectAuthToken(store.getState()) ?? '' }),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    })
  }
  return chatSocket
}

export function disconnectChatSocket(): void {
  if (chatSocket) {
    chatSocket.disconnect()
    chatSocket = null
  }
}
