import type { ITransferUserSummary } from '@/types';
import { formatDateTime, fullName } from '../lib/format';

interface AuditCardProps {
    label: string;
    user: ITransferUserSummary | null;
    timestamp: string | null;
}

export function AuditCard({ label, user, timestamp }: AuditCardProps) {
    return (
        <div className="bg-canvas border border-border rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-2">
                {label}
            </p>
            <p className="text-sm text-text-1 font-medium">{fullName(user)}</p>
            <p className="text-xs text-text-3 mt-1">
                {formatDateTime(timestamp)}
            </p>
        </div>
    );
}
