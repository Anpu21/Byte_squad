import { ApproveTransferModal } from '@/features/transfer-detail/components/ApproveTransferModal';
import { BatchApproveTransferModal } from '@/features/transfer-detail/components/BatchApproveTransferModal';
import { RejectTransferModal } from '@/features/transfer-detail/components/RejectTransferModal';
import { ConfirmTransferActionModal } from '@/features/transfer-detail/components/ConfirmTransferActionModal';
import { BatchConfirmActionModal } from '@/features/transfer-detail/components/BatchConfirmActionModal';
import type { ConfirmAction } from '@/features/transfer-detail/types/transfer-action.type';
import type { BoardActionModalState } from '../hooks/useBoardActionModal';

interface TransferBoardActionModalHostProps {
    modal: BoardActionModalState;
}

export function TransferBoardActionModalHost({
    modal,
}: TransferBoardActionModalHostProps) {
    const {
        activeAction,
        activeTransfers,
        primary,
        isBatch,
        submitting,
        approve,
    } = modal;

    if (!primary || activeAction === null) return null;

    const confirmAction: ConfirmAction | null =
        activeAction === 'cancel' ||
        activeAction === 'ship' ||
        activeAction === 'receive'
            ? activeAction
            : null;

    return (
        <>
            {isBatch ? (
                <BatchApproveTransferModal
                    key={activeTransfers.map((t) => t.id).join(',')}
                    isOpen={activeAction === 'approve'}
                    onClose={modal.close}
                    transfers={activeTransfers}
                    submitting={submitting}
                    onSubmit={modal.handleBatchApproveSubmit}
                />
            ) : (
                <ApproveTransferModal
                    isOpen={activeAction === 'approve'}
                    onClose={modal.close}
                    transfer={primary}
                    state={approve}
                    submitting={submitting}
                    onSubmit={modal.handleSingleApproveSubmit}
                />
            )}

            <RejectTransferModal
                isOpen={activeAction === 'reject'}
                onClose={modal.close}
                reason={modal.rejectionReason}
                onReasonChange={modal.setRejectionReason}
                submitting={submitting}
                onSubmit={modal.handleRejectSubmit}
            />

            {isBatch ? (
                <BatchConfirmActionModal
                    action={confirmAction}
                    count={activeTransfers.length}
                    submitting={submitting}
                    onClose={modal.close}
                    onConfirm={modal.handleConfirmAction}
                />
            ) : (
                <ConfirmTransferActionModal
                    action={confirmAction}
                    transfer={primary}
                    displayQty={
                        primary.approvedQuantity ?? primary.requestedQuantity
                    }
                    submitting={submitting}
                    onClose={modal.close}
                    onConfirm={modal.handleConfirmAction}
                />
            )}
        </>
    );
}
