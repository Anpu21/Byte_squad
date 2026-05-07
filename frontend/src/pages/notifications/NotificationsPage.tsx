import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { INotification } from '@/types/index';
import {
    timeAgo,
    typeIcon,
    groupByDate,
} from '@/components/notifications/notificationUtils';

type FilterTab = 'all' | 'unread' | NotificationType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: NotificationType.LOW_STOCK, label: 'Low Stock' },
    { key: NotificationType.SYSTEM, label: 'System' },
    { key: NotificationType.ALERT, label: 'Alert' },
];

function getFilteredNotifications(
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

function getFilterCount(
    notifications: INotification[],
    filter: FilterTab,
): number {
    return getFilteredNotifications(notifications, filter).length;
}

function NotificationItem({
    notification,
    onOpen,
}: {
    notification: INotification;
    onOpen: (notification: INotification) => void;
}) {
    return (
        <div
            className={`border-b border-white/5 transition-colors ${
                notification.isRead ? 'opacity-60' : 'bg-white/[0.02]'
            }`}
        >
            <button
                onClick={() => onOpen(notification)}
                className="flex items-start gap-4 px-6 py-4 w-full text-left hover:bg-white/[0.03] transition-colors"
            >
                {typeIcon(notification.type)}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p
                            className={`text-sm font-medium ${
                                notification.isRead
                                    ? 'text-slate-400'
                                    : 'text-slate-200'
                            }`}
                        >
                            {notification.title}
                        </p>
                        {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed truncate">
                        {notification.message}
                    </p>
                </div>

                <span className="text-[11px] text-slate-600 font-medium flex-shrink-0 mt-0.5">
                    {timeAgo(notification.createdAt)}
                </span>

                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-600 flex-shrink-0 mt-1"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    );
}

function EmptyState({ filter }: { filter: FilterTab }) {
    const messages: Record<string, { title: string; subtitle: string }> = {
        all: {
            title: 'No notifications yet',
            subtitle: "You're all set — nothing to see here.",
        },
        unread: {
            title: 'All caught up',
            subtitle: 'You have no unread notifications.',
        },
        [NotificationType.LOW_STOCK]: {
            title: 'No low stock alerts',
            subtitle: 'All inventory levels are healthy.',
        },
        [NotificationType.SYSTEM]: {
            title: 'No system notifications',
            subtitle: 'No system messages at this time.',
        },
        [NotificationType.ALERT]: {
            title: 'No alerts',
            subtitle: 'Everything is running smoothly.',
        },
    };

    const msg = messages[filter] ?? messages.all;

    return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 opacity-40"
            >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="text-sm font-medium">{msg.title}</p>
            <p className="text-xs text-slate-600 mt-1">{msg.subtitle}</p>
        </div>
    );
}

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const filtered = getFilteredNotifications(notifications, activeFilter);
    const groups = groupByDate(filtered);

    const openDetail = (notification: INotification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        navigate(
            FRONTEND_ROUTES.NOTIFICATION_DETAIL.replace(':id', notification.id),
        );
    };

    return (
        <div className="animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up'}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 mb-4 p-1 bg-white/[0.03] rounded-xl border border-white/5 w-fit">
                {FILTER_TABS.map((tab) => {
                    const count = getFilterCount(notifications, tab.key);
                    const isActive = activeFilter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                isActive
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                            <span
                                className={`text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
                                    isActive
                                        ? 'bg-slate-900/10 text-slate-700'
                                        : 'bg-white/5 text-slate-500'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Notifications list */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                {filtered.length === 0 ? (
                    <EmptyState filter={activeFilter} />
                ) : (
                    groups.map((group) => (
                        <div key={group.label}>
                            <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/5">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    {group.label}
                                </p>
                            </div>
                            {group.notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onOpen={openDetail}
                                />
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
