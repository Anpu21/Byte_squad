import { NotificationType } from '@/constants/enums';
import type { INotification } from '@/types/index';

export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function typeIcon(type: NotificationType) {
    switch (type) {
        case NotificationType.LOW_STOCK:
            return (
                <div className="w-9 h-9 rounded-lg bg-warning-soft flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
            );
        case NotificationType.ALERT:
            return (
                <div className="w-9 h-9 rounded-lg bg-danger-soft flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="w-9 h-9 rounded-lg bg-info-soft flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </div>
            );
    }
}

export function typeLabel(type: NotificationType): string {
    switch (type) {
        case NotificationType.LOW_STOCK:
            return 'Low Stock';
        case NotificationType.SYSTEM:
            return 'System';
        case NotificationType.ALERT:
            return 'Alert';
        default:
            return 'Notification';
    }
}

export function typeBadgeColor(type: NotificationType): string {
    switch (type) {
        case NotificationType.LOW_STOCK:
            return 'bg-warning-soft text-warning border-amber-500/20';
        case NotificationType.ALERT:
            return 'bg-danger-soft text-danger border-rose-500/20';
        default:
            return 'bg-info-soft text-info border-sky-500/20';
    }
}

export interface DateGroup {
    label: string;
    notifications: INotification[];
}

export function groupByDate(notifications: INotification[]): DateGroup[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: Record<string, INotification[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        Earlier: [],
    };

    for (const n of notifications) {
        const d = new Date(n.createdAt);
        if (d >= today) {
            groups.Today.push(n);
        } else if (d >= yesterday) {
            groups.Yesterday.push(n);
        } else if (d >= weekAgo) {
            groups['This Week'].push(n);
        } else {
            groups.Earlier.push(n);
        }
    }

    return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, notifications: items }));
}
