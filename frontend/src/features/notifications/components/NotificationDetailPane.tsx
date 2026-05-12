import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Check } from 'lucide-react';
import {
    timeAgo,
    typeLabel,
    typeBadgeColor,
} from '@/components/notifications/notificationUtils';
import { NotificationType } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { INotification } from '@/types/index';

interface NotificationDetailPaneProps {
    notification: INotification;
    onDismiss: (id: string) => void;
}

const STAT_DEFS: { label: string; key: string }[] = [
    { label: 'Current stock', key: 'currentStock' },
    { label: 'Threshold', key: 'threshold' },
    { label: 'Avg daily sale', key: 'avgDailySale' },
    { label: 'Days remaining', key: 'daysRemaining' },
];

function StatCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-widest text-text-3">
                {label}
            </p>
            <p className="text-lg font-semibold text-text-1 mt-0.5 mono">
                {value}
            </p>
        </div>
    );
}

export function NotificationDetailPane({
    notification,
    onDismiss,
}: NotificationDetailPaneProps) {
    const navigate = useNavigate();
    const meta = (notification.metadata ?? {}) as Record<string, unknown>;

    const stats = STAT_DEFS
        .filter((s) => meta[s.key] !== undefined && meta[s.key] !== null)
        .map((s) => ({ ...s, value: String(meta[s.key]) }));

    const branchContext =
        typeof meta.branch === 'string'
            ? meta.branch
            : typeof meta.branchName === 'string'
              ? meta.branchName
              : null;

    const isLowStock = notification.type === NotificationType.LOW_STOCK;

    return (
        <Card>
            <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${typeBadgeColor(
                            notification.type,
                        )}`}
                    >
                        {typeLabel(notification.type)}
                    </span>
                    <span
                        className="w-1 h-1 rounded-full bg-text-3"
                        aria-hidden
                    />
                    <span className="text-xs text-text-3">
                        {timeAgo(notification.createdAt)}
                    </span>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-text-1 tracking-tight leading-snug">
                        {notification.title}
                    </h2>
                    {branchContext && (
                        <p className="text-sm text-text-2 mt-1">
                            Branch: {branchContext}
                        </p>
                    )}
                </div>

                <p className="text-[15px] text-text-1 leading-relaxed whitespace-pre-wrap">
                    {notification.message}
                </p>

                {isLowStock && stats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {stats.map((s) => (
                            <StatCell
                                key={s.key}
                                label={s.label}
                                value={s.value}
                            />
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isLowStock && (
                        <Button
                            type="button"
                            onClick={() =>
                                navigate(FRONTEND_ROUTES.TRANSFERS_NEW)
                            }
                        >
                            <ArrowRightLeft size={14} />
                            Create transfer
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onDismiss(notification.id)}
                        disabled={notification.isRead}
                    >
                        <Check size={14} />
                        {notification.isRead ? 'Dismissed' : 'Dismiss'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
