import { io, type Socket } from 'socket.io-client';
import { store } from '@/store';
import { selectAuthToken } from '@/store/selectors/auth';

/**
 * Single shared socket instance for the `/notifications` namespace.
 * Lazy-created on first use; reused across hooks to avoid duplicate
 * connections.
 */
let notificationSocket: Socket | null = null;

// Absolute API origin in prod (e.g. https://realtime.<domain>); empty in dev so
// the connection stays same-origin and the Vite `/socket.io` proxy handles it.
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL ?? '';

export function getNotificationSocket(): Socket {
    if (!notificationSocket) {
        notificationSocket = io(`${SOCKET_BASE}/notifications`, {
            // Send the JWT on the handshake — the realtime service verifies it
            // against the backend's JWKS and joins the user's rooms. Using the
            // callback form means every (re)connect re-reads the current token,
            // so a fresh login / refreshed token is picked up without recreating
            // the socket.
            auth: (cb) => cb({ token: selectAuthToken(store.getState()) ?? '' }),
            // Reconnect aggressively but don't spam the server.
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            // Default transports include polling fallback when ws fails.
            autoConnect: true,
        });
    }
    return notificationSocket;
}

export function disconnectNotificationSocket(): void {
    if (notificationSocket) {
        notificationSocket.disconnect();
        notificationSocket = null;
    }
}
