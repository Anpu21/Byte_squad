import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/constants/enums';
import type { INotification } from '@/types/index';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function typeIcon(type: NotificationType) {
    switch (type) {
        case NotificationType.LOW_STOCK:
            return (
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
            );
        case NotificationType.ALERT:
            return (
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </div>
            );
    }
}

function NotificationItem({
    notification,
    onMarkAsRead,
}: {
    notification: INotification;
    onMarkAsRead: (id: string) => void;
}) {
    return (
        <div
            className={`flex items-start gap-4 px-6 py-4 border-b border-white/5 transition-colors ${
                notification.isRead
                    ? 'opacity-60'
                    : 'bg-white/[0.02]'
            }`}
        >
            {typeIcon(notification.type)}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${notification.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                        {notification.title}
                    </p>
                    {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                    )}
                </div>
                <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                    {notification.message}
                </p>
                <p className="text-[11px] text-slate-600 mt-1.5 font-medium">
                    {timeAgo(notification.createdAt)}
                </p>
            </div>

            {!notification.isRead && (
                <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-[11px] text-slate-500 hover:text-white font-medium px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors flex-shrink-0 mt-0.5"
                >
                    Mark read
                </button>
            )}
        </div>
    );
}

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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

            {/* Notifications list */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-40">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p className="text-sm font-medium">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkAsRead={markAsRead}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
