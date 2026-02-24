import { useEffect, useCallback, useState } from 'react';
import type { INotification } from '@shared/interfaces/index';
import api from '@/services/api';

interface UseNotificationsReturn {
    notifications: INotification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<INotification[]>([]);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get<{ data: INotification[] }>(
                '/notifications',
            );
            setNotifications(response.data.data);
        } catch {
            // Silently fail — notifications are non-critical
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        await api.patch(`/notifications/${id}/read`);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
    }, []);

    const markAllAsRead = useCallback(async () => {
        await api.patch('/notifications/read-all');
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }, []);

    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}
