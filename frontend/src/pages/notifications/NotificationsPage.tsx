import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRightLeft, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { INotification } from '@/types/index';
import {
    timeAgo,
    typeIcon,
    typeLabel,
    typeBadgeColor,
} from '@/components/notifications/notificationUtils';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';

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

function NotificationRow({
    notification,
    isActive,
    onSelect,
}: {
    notification: INotification;
    isActive: boolean;
    onSelect: (n: INotification) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(notification)}
            className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-l-2 transition-colors ${
                isActive
                    ? 'border-l-primary bg-primary-soft/40'
                    : 'border-l-transparent hover:bg-surface-2'
            } ${notification.isRead ? '' : 'bg-surface-2/40'}`}
        >
            {typeIcon(notification.type)}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={`text-sm truncate ${
                            notification.isRead
                                ? 'text-text-2 font-medium'
                                : 'text-text-1 font-semibold'
                        }`}
                    >
                        {notification.title}
                    </p>
                    {!notification.isRead && (
                        <span
                            className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                            aria-hidden
                        />
                    )}
                </div>
                <p className="text-[12.5px] text-text-3 mt-0.5 leading-relaxed line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-[11px] text-text-3 mt-1.5">
                    {timeAgo(notification.createdAt)}
                </p>
            </div>
        </button>
    );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-widest text-text-3">
                {label}
            </p>
            <p className="text-lg font-semibold text-text-1 mt-0.5 mono">
                {value}
            </p>
        </div>
    );
}

function DetailPane({
    notification,
    onDismiss,
}: {
    notification: INotification;
    onDismiss: (id: string) => void;
}) {
    const navigate = useNavigate();
    const meta = (notification.metadata ?? {}) as Record<string, unknown>;

    const statDefs: { label: string; key: string }[] = [
        { label: 'Current stock', key: 'currentStock' },
        { label: 'Threshold', key: 'threshold' },
        { label: 'Avg daily sale', key: 'avgDailySale' },
        { label: 'Days remaining', key: 'daysRemaining' },
    ];

    const stats = statDefs
        .filter((s) => meta[s.key] !== undefined && meta[s.key] !== null)
        .map((s) => ({ ...s, value: String(meta[s.key]) }));

    const branchContext =
        typeof meta.branch === 'string'
            ? meta.branch
            : typeof meta.branchName === 'string'
              ? meta.branchName
              : null;

    const isLowStock = notification.type === NotificationType.LOW_STOCK;

    return (
        <Card>
            <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${typeBadgeColor(
                            notification.type,
                        )}`}
                    >
                        {typeLabel(notification.type)}
                    </span>
                    <span
                        className="w-1 h-1 rounded-full bg-text-3"
                        aria-hidden
                    />
                    <span className="text-xs text-text-3">
                        {timeAgo(notification.createdAt)}
                    </span>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-text-1 tracking-tight leading-snug">
                        {notification.title}
                    </h2>
                    {branchContext && (
                        <p className="text-sm text-text-2 mt-1">
                            Branch: {branchContext}
                        </p>
                    )}
                </div>

                <p className="text-[15px] text-text-1 leading-relaxed whitespace-pre-wrap">
                    {notification.message}
                </p>

                {isLowStock && stats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {stats.map((s) => (
                            <StatCell
                                key={s.key}
                                label={s.label}
                                value={s.value}
                            />
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isLowStock && (
                        <Button
                            type="button"
                            onClick={() =>
                                navigate(FRONTEND_ROUTES.TRANSFERS_NEW)
                            }
                        >
                            <ArrowRightLeft size={14} />
                            Create transfer
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onDismiss(notification.id)}
                        disabled={notification.isRead}
                    >
                        <Check size={14} />
                        {notification.isRead ? 'Dismissed' : 'Dismiss'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function DetailEmpty() {
    return (
        <Card>
            <CardContent className="p-10">
                <div className="flex flex-col items-center justify-center py-16 text-text-3">
                    <Bell size={40} className="opacity-40 mb-4" />
                    <p className="text-sm font-medium text-text-2">
                        Select a notification to view details
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filtered = useMemo(
        () => getFilteredNotifications(notifications, activeFilter),
        [notifications, activeFilter],
    );

    const segmentedOptions = FILTER_TABS.map((tab) => ({
        value: tab.key,
        label: `${tab.label} · ${getFilteredNotifications(notifications, tab.key).length}`,
    }));

    const selected = useMemo(
        () => filtered.find((n) => n.id === selectedId) ?? null,
        [filtered, selectedId],
    );

    const handleSelect = (notification: INotification) => {
        const isDesktop =
            typeof window !== 'undefined' && window.innerWidth >= 1024;

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

    const handleDismiss = (id: string) => {
        markAsRead(id);
    };

    return (
        <div className="animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-sm text-text-3 mt-1">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                            : 'All caught up'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="secondary" onClick={markAllAsRead}>
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Filter row */}
            <div className="mb-4">
                <Segmented<FilterTab>
                    value={activeFilter}
                    options={segmentedOptions}
                    onChange={setActiveFilter}
                />
            </div>

            {/* Split view */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: list */}
                <div className="lg:col-span-1">
                    <Card>
                        <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-text-3">
                                    <Bell
                                        size={36}
                                        className="opacity-40 mb-3"
                                    />
                                    <p className="text-sm font-medium text-text-2">
                                        {activeFilter === 'unread'
                                            ? 'All caught up'
                                            : 'No notifications'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filtered.map((n) => (
                                        <NotificationRow
                                            key={n.id}
                                            notification={n}
                                            isActive={selectedId === n.id}
                                            onSelect={handleSelect}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: detail (desktop only) */}
                <div className="hidden lg:block lg:col-span-2">
                    {selected ? (
                        <DetailPane
                            notification={selected}
                            onDismiss={handleDismiss}
                        />
                    ) : (
                        <DetailEmpty />
                    )}
                </div>
            </div>
        </div>
    );
}
