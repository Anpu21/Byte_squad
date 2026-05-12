import type { CustomerRequestStatus } from '@/types';
import { STATUS_LABEL, STATUS_TONE } from '../lib/status-style';

interface StatusBadgeProps {
    status: CustomerRequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span
            className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_TONE[status]}`}
        >
            {STATUS_LABEL[status]}
        </span>
    );
}
