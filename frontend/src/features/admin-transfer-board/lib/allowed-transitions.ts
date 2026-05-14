import { TransferStatus } from '@/constants/enums';

export type DropAction =
    | 'approve'
    | 'reject'
    | 'cancel'
    | 'ship'
    | 'receive';

// Maps (from-column, to-column) to the action a drop should open. Returns null
// for forbidden moves (same column, terminal-source, backwards, skip-stages).
// PENDING -> closed defaults to Reject (deny-the-request); cancelling a
// PENDING transfer must be done from the detail page.
export function getDropAction(
    fromColumnId: string,
    toColumnId: string,
): DropAction | null {
    if (fromColumnId === toColumnId) return null;
    if (fromColumnId === 'todo' && toColumnId === 'approved') return 'approve';
    if (fromColumnId === 'todo' && toColumnId === 'closed') return 'reject';
    if (fromColumnId === 'approved' && toColumnId === 'in-transit')
        return 'ship';
    if (fromColumnId === 'approved' && toColumnId === 'closed') return 'cancel';
    if (fromColumnId === 'in-transit' && toColumnId === 'done')
        return 'receive';
    return null;
}

export function columnIdForStatus(status: TransferStatus): string | null {
    switch (status) {
        case TransferStatus.PENDING:
            return 'todo';
        case TransferStatus.APPROVED:
            return 'approved';
        case TransferStatus.IN_TRANSIT:
            return 'in-transit';
        case TransferStatus.COMPLETED:
            return 'done';
        case TransferStatus.REJECTED:
        case TransferStatus.CANCELLED:
            return 'closed';
        default:
            return null;
    }
}
