import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTransferDetail } from './useTransferDetail';
import { useApproveTransferModal } from './useApproveTransferModal';
import { computeTransferPermissions } from '../lib/permissions';
import type { TransferAction, ConfirmAction } from '../types/transfer-action.type';

export function useTransferDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const detail = useTransferDetail(id);

    const [activeAction, setActiveAction] = useState<TransferAction | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const approve = useApproveTransferModal({
        transferId: id,
        isOpen: activeAction === 'approve',
    });

    const closeModal = useCallback(() => {
        if (detail.submitting) return;
        setActiveAction(null);
        setRejectionReason('');
    }, [detail.submitting]);

    const openApprove = useCallback(() => {
        if (!detail.transfer) return;
        setActiveAction('approve');
        approve.reset();
    }, [approve, detail.transfer]);

    const openApproveWith = useCallback(
        (branchId: string) => {
            if (!detail.transfer) return;
            approve.reset();
            approve.setChosenSourceId(branchId);
            setActiveAction('approve');
        },
        [approve, detail.transfer],
    );

    const handleApproveSubmit = useCallback(async () => {
        if (!detail.transfer) return;
        if (!approve.chosenSourceId) {
            toast.error('Pick a source branch first');
            return;
        }
        const qty = detail.transfer.requestedQuantity;
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
        if (ok) setActiveAction(null);
    }, [approve, detail]);

    const handleRejectSubmit = useCallback(async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a reason');
            return;
        }
        const ok = await detail.reject(rejectionReason.trim());
        if (ok) {
            setActiveAction(null);
            setRejectionReason('');
        }
    }, [detail, rejectionReason]);

    const handleConfirmAction = useCallback(
        async (action: ConfirmAction) => {
            const ok = await (action === 'cancel'
                ? detail.cancel()
                : action === 'ship'
                  ? detail.ship()
                  : detail.receive());
            if (ok) setActiveAction(null);
        },
        [detail],
    );

    const permissions = detail.transfer
        ? computeTransferPermissions(detail.transfer, user)
        : null;

    return {
        id,
        transfer: detail.transfer,
        isLoading: detail.isLoading,
        error: detail.error,
        submitting: detail.submitting,
        permissions,
        activeAction,
        setActiveAction,
        openApprove,
        openApproveWith,
        closeModal,
        approve,
        handleApproveSubmit,
        rejectionReason,
        setRejectionReason,
        handleRejectSubmit,
        handleConfirmAction,
    };
}
