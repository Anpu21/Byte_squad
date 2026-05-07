import Pill, { type PillTone } from './Pill';

type Status = string;

const STATUS_MAP: Record<string, { tone: PillTone; label: string }> = {
    // Generic
    ok: { tone: 'success', label: 'OK' },
    success: { tone: 'success', label: 'Success' },
    completed: { tone: 'success', label: 'Completed' },
    done: { tone: 'success', label: 'Done' },
    active: { tone: 'success', label: 'Active' },
    open: { tone: 'success', label: 'Open' },
    in_stock: { tone: 'success', label: 'In stock' },

    pending: { tone: 'warning', label: 'Pending' },
    low: { tone: 'warning', label: 'Low' },
    away: { tone: 'warning', label: 'Away' },
    invited: { tone: 'neutral', label: 'Invited' },

    refund: { tone: 'danger', label: 'Refunded' },
    refunded: { tone: 'danger', label: 'Refunded' },
    rejected: { tone: 'danger', label: 'Rejected' },
    out: { tone: 'danger', label: 'Out of stock' },
    out_of_stock: { tone: 'danger', label: 'Out of stock' },
    failed: { tone: 'danger', label: 'Failed' },
    cancelled: { tone: 'neutral', label: 'Cancelled' },
    canceled: { tone: 'neutral', label: 'Cancelled' },
    void: { tone: 'neutral', label: 'Voided' },
    voided: { tone: 'neutral', label: 'Voided' },

    transit: { tone: 'info', label: 'In transit' },
    in_transit: { tone: 'info', label: 'In transit' },
    received: { tone: 'success', label: 'Received' },
    approved: { tone: 'primary', label: 'Approved' },
    ready: { tone: 'info', label: 'Ready' },
    fulfilled: { tone: 'success', label: 'Fulfilled' },
};

interface StatusPillProps {
    status: Status;
    label?: string;
}

export default function StatusPill({ status, label }: StatusPillProps) {
    const key = String(status).toLowerCase().replace(/-/g, '_');
    const meta = STATUS_MAP[key] ?? { tone: 'neutral' as PillTone, label: status };
    return <Pill tone={meta.tone}>{label ?? meta.label}</Pill>;
}
