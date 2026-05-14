import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useTransferDetail } from '@/features/transfer-detail/hooks/useTransferDetail';
import { useApproveTransferModal } from '@/features/transfer-detail/hooks/useApproveTransferModal';
import type { ConfirmAction } from '@/features/transfer-detail/types/transfer-action.type';

export type BoardModalAction =
    | 'approve'
    | 'reject'
    | 'ship'
    | 'receive'
    | 'cancel';

interface OpenArgs {
    transferId: string;
    action: BoardModalAction;
    requestedQuantity: number;
}

export function useBoardActionModal() {
    const [activeTransferId, setActiveTransferId] = useState<string | null>(
        null,
    );
    const [activeAction, setActiveAction] = useState<BoardModalAction | null>(
        null,
    );
    const [rejectionReason, setRejectionReason] = useState('');

    const detail = useTransferDetail(activeTransferId ?? undefined);
    const approve = useApproveTransferModal({
        transferId: activeTransferId ?? undefined,
        isOpen: activeAction === 'approve',
    });

    const open = useCallback(
        ({ transferId, action, requestedQuantity }: OpenArgs) => {
            setActiveTransferId(transferId);
            setActiveAction(action);
            if (action === 'approve') {
                approve.reset(requestedQuantity);
            }
            if (action === 'reject') {
                setRejectionReason('');
            }
        },
        [approve],
    );

    const close = useCallback(() => {
        if (detail.submitting) return;
        setActiveAction(null);
        setActiveTransferId(null);
        setRejectionReason('');
    }, [detail.submitting]);

    const handleApproveSubmit = useCallback(async () => {
        if (!detail.transfer) return;
        if (!approve.chosenSourceId) {
            toast.error('Pick a source branch first');
            return;
        }
        const qty = parseInt(approve.approvedQuantityStr, 10);
        if (
            Number.isNaN(qty) ||
            qty < 1 ||
            qty > detail.transfer.requestedQuantity
        ) {
            toast.error(
                `Approved quantity must be between 1 and ${detail.transfer.requestedQuantity}`,
            );
            return;
        }
        const chosenSource = approve.sourceOptions.find(
            (opt) => opt.branchId === approve.chosenSourceId,
        );
        if (chosenSource && qty > chosenSource.currentQuantity) {
            toast.error(
                `${chosenSource.branchName} only has ${chosenSource.currentQuantity} unit(s) in stock`,
            );
            return;
        }
        const ok = await detail.approve({
            sourceBranchId: approve.chosenSourceId,
            approvedQuantity: qty,
            approvalNote: approve.approvalNote.trim() || undefined,
        });
        if (ok) close();
    }, [approve, detail, close]);

    const handleRejectSubmit = useCallback(async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a reason');
            return;
        }
        const ok = await detail.reject(rejectionReason.trim());
        if (ok) close();
    }, [detail, rejectionReason, close]);

    const handleConfirmAction = useCallback(
        async (action: ConfirmAction) => {
            const ok = await (action === 'cancel'
                ? detail.cancel()
                : action === 'ship'
                  ? detail.ship()
                  : detail.receive());
            if (ok) close();
        },
        [detail, close],
    );

    return {
        activeAction,
        transfer: detail.transfer,
        submitting: detail.submitting,
        approve,
        rejectionReason,
        setRejectionReason,
        open,
        close,
        handleApproveSubmit,
        handleRejectSubmit,
        handleConfirmAction,
    };
}

export type BoardActionModalState = ReturnType<typeof useBoardActionModal>;
