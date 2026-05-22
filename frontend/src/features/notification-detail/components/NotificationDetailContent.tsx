import NotificationIcon from '@/components/notifications/NotificationIcon';
import {
    typeBadgeColor,
    typeLabel,
} from '@/components/notifications/notificationUtils';
import type { INotification } from '@/types/index';
import { formatFullDate } from '../lib/format';
import { NotificationMetadata } from './NotificationMetadata';

interface NotificationDetailContentProps {
    notification: INotification;
}

export function NotificationDetailContent({
    notification,
}: NotificationDetailContentProps) {
    return (
        <article className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-border">
                <div className="flex items-start gap-4">
                    <NotificationIcon type={notification.type} />
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${typeBadgeColor(
                                    notification.type,
                                )}`}
                            >
                                {typeLabel(notification.type)}
                            </span>
                            {notification.isRead ? (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border bg-surface-2 text-text-3 border-border">
                                    Read
                                </span>
                            ) : (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border bg-primary-soft text-text-1 border-border">
                                    New
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-text-1 tracking-tight leading-snug">
                            {notification.title}
                        </h1>
                        <p className="text-[12px] text-text-3 mt-2">
                            {formatFullDate(notification.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-8 py-8">
                <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-3">
                    Message
                </h2>
                <p className="text-[15px] text-text-1 leading-relaxed whitespace-pre-wrap break-words">
                    {notification.message}
                </p>

                <NotificationMetadata metadata={notification.metadata} />
            </div>
        </article>
    );
}
