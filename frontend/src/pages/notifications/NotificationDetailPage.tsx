import { useNotificationDetailPage } from '@/features/notification-detail/hooks/useNotificationDetailPage';
import { NotificationDetailLoading } from '@/features/notification-detail/components/NotificationDetailLoading';
import { NotificationDetailNotFound } from '@/features/notification-detail/components/NotificationDetailNotFound';
import { NotificationDetailError } from '@/features/notification-detail/components/NotificationDetailError';
import { NotificationDetailContent } from '@/features/notification-detail/components/NotificationDetailContent';

export function NotificationDetailPage() {
    const p = useNotificationDetailPage();

    return (
        <div className="animate-in fade-in duration-300 max-w-3xl">
            <button
                onClick={p.goBack}
                className="flex items-center gap-2 text-[13px] font-medium text-text-2 hover:text-text-1 mb-6 transition-colors"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to notifications
            </button>

            {p.isLoading && <NotificationDetailLoading />}
            {p.notFound && <NotificationDetailNotFound />}
            {p.errorMessage && (
                <NotificationDetailError
                    message={p.errorMessage}
                    onRetry={p.retry}
                />
            )}
            {p.notification && (
                <NotificationDetailContent notification={p.notification} />
            )}
        </div>
    );
}
