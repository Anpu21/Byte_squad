import { NotificationType } from '@/constants/enums';
import type { DateGroup, INotification } from '@/types';

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
