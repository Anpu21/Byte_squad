import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { timeAgo } from './notificationUtils';
import NotificationIcon from './NotificationIcon';

export default function NotificationDropdown() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const recent = notifications.slice(0, 5);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                )}
            </button>

            {open && (
                <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] sm:max-w-[calc(100vw-1rem)] bg-surface border border-border rounded-md shadow-md-token z-dropdown overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-text-1">
                            Notifications
                            {unreadCount > 0 && (
                                <span
                                    className="ml-2 text-[11px] font-bold bg-primary-soft text-primary-soft-text rounded-full px-1.5 py-0.5"
                                    aria-label={`${unreadCount} unread`}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </p>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-[11px] text-text-2 hover:text-text-1 font-medium transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                        {recent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-text-3">
                                <Bell size={28} className="mb-3 opacity-50" />
                                <p className="text-xs font-medium">No notifications</p>
                            </div>
                        ) : (
                            recent.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                        setOpen(false);
                                        navigate(
                                            FRONTEND_ROUTES.NOTIFICATION_DETAIL.replace(
                                                ':id',
                                                n.id,
                                            ),
                                        );
                                    }}
                                    className={`flex items-start gap-3 px-4 py-3 w-full text-left border-b border-border hover:bg-surface-2 transition-colors ${
                                        n.isRead ? 'opacity-60' : ''
                                    }`}
                                >
                                    <div className="scale-[0.85] origin-top-left -mr-1">
                                        <NotificationIcon type={n.type} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-[13px] truncate ${
                                                    n.isRead
                                                        ? 'text-text-2 font-normal'
                                                        : 'text-text-1 font-semibold'
                                                }`}
                                            >
                                                {n.title}
                                            </p>
                                            {!n.isRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-text-3 mt-0.5 truncate">
                                            {n.message}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-text-3 font-medium flex-shrink-0 mt-0.5">
                                        {timeAgo(n.createdAt)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setOpen(false);
                            navigate(FRONTEND_ROUTES.NOTIFICATIONS);
                        }}
                        className="w-full px-4 py-2.5 text-[13px] font-medium text-text-2 hover:text-text-1 hover:bg-surface-2 border-t border-border transition-colors text-center"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
}
