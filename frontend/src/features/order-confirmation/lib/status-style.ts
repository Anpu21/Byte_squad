import type { CustomerOrderStatus } from '@/types';

export const STATUS_LABEL: Record<CustomerOrderStatus, string> = {
    pending: 'Awaiting pickup',
    accepted: 'Accepted — ready for pickup',
    completed: 'Picked up',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

export const STATUS_TONE: Record<CustomerOrderStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    accepted: 'bg-primary-soft text-primary-soft-text border-primary/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-surface-2 text-text-1 border-border',
    expired: 'bg-surface-2 text-text-2 border-border',
};
