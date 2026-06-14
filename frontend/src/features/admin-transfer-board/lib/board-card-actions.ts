import { TransferStatus } from '@/constants/enums';
import type { BoardModalAction } from '../hooks/useBoardActionModal';

export interface BoardCardAction {
    action: BoardModalAction;
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
}

/**
 * The explicit actions a transfer in a given status supports — the same set the
 * drag-drop transitions allow, surfaced as buttons for accessibility + speed.
 */
export function boardActionsForStatus(
    status: TransferStatus,
): BoardCardAction[] {
    switch (status) {
        case TransferStatus.PENDING:
            return [
                { action: 'approve', label: 'Approve', variant: 'primary' },
                { action: 'reject', label: 'Reject', variant: 'danger' },
            ];
        case TransferStatus.APPROVED:
            return [
                { action: 'ship', label: 'Ship', variant: 'primary' },
                { action: 'cancel', label: 'Cancel', variant: 'secondary' },
            ];
        case TransferStatus.IN_TRANSIT:
            return [{ action: 'receive', label: 'Receive', variant: 'primary' }];
        default:
            return [];
    }
}
