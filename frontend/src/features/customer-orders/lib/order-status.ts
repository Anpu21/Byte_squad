import type { CustomerOrderStatus } from '@/types';

/**
 * Staff-facing collection wording for a pickup order's status. `pending`/the
 * legacy `accepted` both read "Awaiting pickup"; `completed` (fulfilled) reads
 * "Collected"; the new no-show state reads "Not collected".
 */
export const STAFF_ORDER_STATUS_LABEL: Record<CustomerOrderStatus, string> = {
    pending: 'Awaiting pickup',
    accepted: 'Awaiting pickup',
    completed: 'Collected',
    not_collected: 'Not collected',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

/** An order still awaiting collection (no terminal outcome yet). */
export function isAwaitingCollection(status: CustomerOrderStatus): boolean {
    return status === 'pending' || status === 'accepted';
}
