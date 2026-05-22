import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationSocket } from '@/services/socket.service';
import { NotificationType } from '@/constants/enums';

interface SocketNotification {
    type?: string;
    title?: string;
    message?: string;
    userId?: string;
}

// Subscribe to the shared `/notifications` socket and invalidate the
// `['stock-transfers']` query family whenever a STOCK_TRANSFER notification
// arrives. Used on the admin Kanban + the manager's TransferRequestsPage so
// both views auto-refresh after any lifecycle event (create / approve /
// reject / ship / receive / cancel) without manual reloads.
export function useStockTransferRealtime(): void {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = getNotificationSocket();
        const handler = (payload: SocketNotification) => {
            if (payload?.type === NotificationType.STOCK_TRANSFER) {
                queryClient.invalidateQueries({
                    queryKey: ['stock-transfers'],
                });
            }
        };
        socket.on('notification', handler);
        return () => {
            socket.off('notification', handler);
        };
    }, [queryClient]);
}
