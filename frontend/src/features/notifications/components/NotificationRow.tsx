import { timeAgo } from '@/components/notifications/notificationUtils';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import type { INotification } from '@/types/index';

interface NotificationRowProps {
    notification: INotification;
    isActive: boolean;
    onSelect: (n: INotification) => void;
}

export function NotificationRow({
    notification,
    isActive,
    onSelect,
}: NotificationRowProps) {
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
            <NotificationIcon type={notification.type} />
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
