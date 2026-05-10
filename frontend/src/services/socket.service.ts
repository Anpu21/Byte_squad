import { io, type Socket } from 'socket.io-client';

/**
 * Single shared socket instance for the `/notifications` namespace.
 * Lazy-created on first use; reused across hooks to avoid duplicate
 * connections.
 */
let notificationSocket: Socket | null = null;

export function getNotificationSocket(): Socket {
    if (!notificationSocket) {
        notificationSocket = io('/notifications', {
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
