import type { CustomerOrderPaymentStatus } from '@/types';

const PAYMENT_LABEL: Record<CustomerOrderPaymentStatus, string> = {
    unpaid: 'Unpaid',
    pending: 'Payment pending',
    paid: 'Paid',
    failed: 'Failed',
    cancelled: 'Cancelled',
};

const PAYMENT_TONE: Record<CustomerOrderPaymentStatus, string> = {
    unpaid: 'bg-surface-2 text-text-2 border-border',
    pending: 'bg-warning-soft text-warning border-warning/40',
    paid: 'bg-accent-soft text-accent-text border-accent/40',
    failed: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-surface-2 text-text-2 border-border',
};

interface PaymentStatusBadgeProps {
    status: CustomerOrderPaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
    return (
        <span
            className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${PAYMENT_TONE[status]}`}
        >
            {PAYMENT_LABEL[status]}
        </span>
    );
}
