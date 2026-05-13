import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';
import { useNotificationsPage } from '@/features/notifications/hooks/useNotificationsPage';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import { NotificationDetailPane } from '@/features/notifications/components/NotificationDetailPane';
import { NotificationDetailEmpty } from '@/features/notifications/components/NotificationDetailEmpty';
import type { FilterTab } from '@/features/notifications/lib/filter-tabs';

export function NotificationsPage() {
    const p = useNotificationsPage();

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-sm text-text-3 mt-1">
                        {p.unreadCount > 0
                            ? `You have ${p.unreadCount} unread notification${p.unreadCount === 1 ? '' : 's'}`
                            : 'All caught up'}
                    </p>
                </div>
                {p.unreadCount > 0 && (
                    <Button variant="secondary" onClick={p.markAllAsRead}>
                        Mark all read
                    </Button>
                )}
            </div>

            <div className="mb-4">
                <Segmented<FilterTab>
                    value={p.activeFilter}
                    options={p.segmentedOptions}
                    onChange={p.setActiveFilter}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                    <NotificationList
                        notifications={p.filtered}
                        selectedId={p.selectedId}
                        activeFilter={p.activeFilter}
                        onSelect={p.handleSelect}
                    />
                </div>

                <div className="hidden lg:block lg:col-span-2">
                    {p.selected ? (
                        <NotificationDetailPane
                            notification={p.selected}
                            onDismiss={p.handleDismiss}
                        />
                    ) : (
                        <NotificationDetailEmpty />
                    )}
                </div>
            </div>
        </div>
    );
}
