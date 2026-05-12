import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { INotification } from '@/types/index';
import {
    FILTER_TABS,
    getFilteredNotifications,
    type FilterTab,
} from '../lib/filter-tabs';

const DESKTOP_BREAKPOINT = 1024;

export function useNotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filtered = useMemo(
        () => getFilteredNotifications(notifications, activeFilter),
        [notifications, activeFilter],
    );

    const segmentedOptions = useMemo(
        () =>
            FILTER_TABS.map((tab) => ({
                value: tab.key,
                label: `${tab.label} · ${getFilteredNotifications(notifications, tab.key).length}`,
            })),
        [notifications],
    );

    const selected = useMemo(
        () => filtered.find((n) => n.id === selectedId) ?? null,
        [filtered, selectedId],
    );

    const handleSelect = (notification: INotification) => {
        const isDesktop =
            typeof window !== 'undefined' &&
            window.innerWidth >= DESKTOP_BREAKPOINT;

        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        if (isDesktop) {
            setSelectedId(notification.id);
        } else {
            navigate(
                FRONTEND_ROUTES.NOTIFICATION_DETAIL.replace(
                    ':id',
                    notification.id,
                ),
            );
        }
    };

    return {
        filtered,
        unreadCount,
        activeFilter,
        setActiveFilter,
        segmentedOptions,
        selected,
        selectedId,
        handleSelect,
        handleDismiss: markAsRead,
        markAllAsRead,
    };
}
