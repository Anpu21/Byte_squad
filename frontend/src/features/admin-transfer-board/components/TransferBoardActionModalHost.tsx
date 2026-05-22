import { ApproveTransferModal } from '@/features/transfer-detail/components/ApproveTransferModal';
import { RejectTransferModal } from '@/features/transfer-detail/components/RejectTransferModal';
import { ConfirmTransferActionModal } from '@/features/transfer-detail/components/ConfirmTransferActionModal';
import type { ConfirmAction } from '@/features/transfer-detail/types/transfer-action.type';
import type { BoardActionModalState } from '../hooks/useBoardActionModal';

interface TransferBoardActionModalHostProps {
    modal: BoardActionModalState;
}

export function TransferBoardActionModalHost({
    modal,
}: TransferBoardActionModalHostProps) {
    const { activeAction, transfer, submitting, approve } = modal;

    if (!transfer || activeAction === null) return null;

    const displayQty =
        transfer.approvedQuantity ?? transfer.requestedQuantity;
    const confirmAction: ConfirmAction | null =
        activeAction === 'cancel' ||
        activeAction === 'ship' ||
        activeAction === 'receive'
            ? activeAction
            : null;

    return (
        <>
            <ApproveTransferModal
                isOpen={activeAction === 'approve'}
                onClose={modal.close}
                transfer={transfer}
                state={approve}
                submitting={submitting}
                onSubmit={modal.handleApproveSubmit}
            />
            <RejectTransferModal
                isOpen={activeAction === 'reject'}
                onClose={modal.close}
                reason={modal.rejectionReason}
                onReasonChange={modal.setRejectionReason}
                submitting={submitting}
                onSubmit={modal.handleRejectSubmit}
            />
            <ConfirmTransferActionModal
                action={confirmAction}
                transfer={transfer}
                displayQty={displayQty}
                submitting={submitting}
                onClose={modal.close}
                onConfirm={modal.handleConfirmAction}
            />
        </>
    );
}
