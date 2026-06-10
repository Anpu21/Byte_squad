import Pill from '@/components/ui/Pill';
import type { GrnPaymentStatus } from '@/types';

const TONE: Record<GrnPaymentStatus, 'danger' | 'warning' | 'success'> = {
    Unpaid: 'danger',
    Partially_Paid: 'warning',
    Paid: 'success',
};

/** Payment-status pill for a GRN bill. */
export function GrnPaymentPill({ status }: { status: GrnPaymentStatus }) {
    return <Pill tone={TONE[status]}>{status.replace('_', ' ')}</Pill>;
}
