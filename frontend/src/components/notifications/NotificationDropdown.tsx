import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { timeAgo, typeIcon } from './notificationUtils';

export default function NotificationDropdown() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const recent = notifications.slice(0, 5);

    // Close on click outside
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

    // Close on Escape
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
            {/* Bell button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
                        <p className="text-sm font-semibold text-white">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-[11px] font-bold bg-white text-slate-900 rounded-full px-1.5 py-0.5">
                                    {unreadCount}
                                </span>
                            )}
                        </p>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-[11px] text-slate-400 hover:text-white font-medium transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Items */}
                    <div className="max-h-[360px] overflow-y-auto">
                        {recent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mb-3 opacity-40"
                                >
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                <p className="text-xs font-medium">
                                    No notifications
                                </p>
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
                                    className={`flex items-start gap-3 px-5 py-3.5 w-full text-left border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                                        n.isRead ? 'opacity-50' : ''
                                    }`}
                                >
                                    <div className="scale-[0.85] origin-top-left -mr-1">
                                        {typeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-[13px] font-medium truncate ${
                                                    n.isRead
                                                        ? 'text-slate-400'
                                                        : 'text-slate-200'
                                                }`}
                                            >
                                                {n.title}
                                            </p>
                                            {!n.isRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                            {n.message}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-medium flex-shrink-0 mt-0.5">
                                        {timeAgo(n.createdAt)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <button
                        onClick={() => {
                            setOpen(false);
                            navigate(FRONTEND_ROUTES.NOTIFICATIONS);
                        }}
                        className="w-full px-5 py-3 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.03] border-t border-white/5 transition-colors text-center"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
}
