import { Bell } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { INotification } from '@/types/index';
import { NotificationRow } from './NotificationRow';
import type { FilterTab } from '../lib/filter-tabs';

interface NotificationListProps {
    notifications: INotification[];
    selectedId: string | null;
    activeFilter: FilterTab;
    onSelect: (n: INotification) => void;
}

export function NotificationList({
    notifications,
    selectedId,
    activeFilter,
    onSelect,
}: NotificationListProps) {
    return (
        <Card>
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-3">
                        <Bell size={36} className="opacity-40 mb-3" />
                        <p className="text-sm font-medium text-text-2">
                            {activeFilter === 'unread'
                                ? 'All caught up'
                                : 'No notifications'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map((n) => (
                            <NotificationRow
                                key={n.id}
                                notification={n}
                                isActive={selectedId === n.id}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
