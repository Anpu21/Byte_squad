import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { INotification } from '@/types';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from '@/lib/queryKeys';

interface UseNotificationsReturn {
    notifications: INotification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.notifications.list(),
        queryFn: notificationsService.list,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationsService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.list(),
            });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationsService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.list(),
            });
        },
    });

    const notifications = query.data ?? [];
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
        notifications,
        unreadCount,
        markAsRead: async (id) => {
            await markAsReadMutation.mutateAsync(id);
        },
        markAllAsRead: async () => {
            await markAllAsReadMutation.mutateAsync();
        },
        refetch: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.list(),
            });
        },
    };
}
