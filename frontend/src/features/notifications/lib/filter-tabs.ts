import { NotificationType } from '@/constants/enums';
import type { INotification } from '@/types/index';

export type FilterTab = 'all' | 'unread' | NotificationType;

export const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: NotificationType.LOW_STOCK, label: 'Low Stock' },
    { key: NotificationType.SYSTEM, label: 'System' },
    { key: NotificationType.ALERT, label: 'Alert' },
];

export function getFilteredNotifications(
    notifications: INotification[],
    filter: FilterTab,
): INotification[] {
    switch (filter) {
        case 'all':
            return notifications;
        case 'unread':
            return notifications.filter((n) => !n.isRead);
        default:
            return notifications.filter((n) => n.type === filter);
    }
}
