import { useCallback, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { useApproveTransferModal } from '@/features/transfer-detail/hooks/useApproveTransferModal';
import type { ConfirmAction } from '@/features/transfer-detail/types/transfer-action.type';
import type { IStockTransferRequest } from '@/types';

export type BoardModalAction =
    | 'approve'
    | 'reject'
    | 'ship'
    | 'receive'
    | 'cancel';

interface OpenArgs {
    transfers: IStockTransferRequest[];
    action: BoardModalAction;
}

function extractErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
        return String(err.response.data.message);
    }
    return fallback;
}

export function useBoardActionModal() {
    const queryClient = useQueryClient();
    const [activeTransfers, setActiveTransfers] = useState<
        IStockTransferRequest[]
    >([]);
    const [activeAction, setActiveAction] = useState<BoardModalAction | null>(
        null,
    );
    const [submitting, setSubmitting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const isBatch = activeTransfers.length > 1;
    const primary = activeTransfers[0] ?? null;
    const isSingleApprove =
        activeAction === 'approve' && activeTransfers.length === 1;

    const approve = useApproveTransferModal({
        transferId: isSingleApprove ? primary?.id : undefined,
        isOpen: isSingleApprove,
    });

    const open = useCallback(
        ({ transfers, action }: OpenArgs) => {
            setActiveTransfers(transfers);
            setActiveAction(action);
            if (action === 'approve') {
                approve.reset();
            }
            if (action === 'reject') {
                setRejectionReason('');
            }
        },
        [approve],
    );

    const close = useCallback(() => {
        if (submitting) return;
        setActiveTransfers([]);
        setActiveAction(null);
        setRejectionReason('');
    }, [submitting]);

    const invalidate = useCallback(
        () =>
            queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }),
        [queryClient],
    );

    const runForAll = useCallback(
        async (
            op: (transfer: IStockTransferRequest) => Promise<unknown>,
            successMessage: string,
            failureMessage: string,
        ): Promise<boolean> => {
            if (activeTransfers.length === 0) return false;
            setSubmitting(true);
            try {
                for (const t of activeTransfers) {
                    await op(t);
                }
                toast.success(successMessage);
                await invalidate();
                return true;
            } catch (err) {
                toast.error(extractErrorMessage(err, failureMessage));
                return false;
            } finally {
                setSubmitting(false);
            }
        },
        [activeTransfers, invalidate],
    );

    const handleSingleApproveSubmit = useCallback(async () => {
        if (!primary) return;
        if (!approve.chosenSourceId) {
            toast.error('Pick a source branch first');
            return;
        }
        const qty = primary.requestedQuantity;
        const chosen = approve.sourceOptions.find(
            (o) => o.branchId === approve.chosenSourceId,
        );
        if (chosen && qty > chosen.currentQuantity) {
            toast.error(
                `${chosen.branchName} only has ${chosen.currentQuantity} unit(s) in stock`,
            );
            return;
        }
        const ok = await runForAll(
            (t) =>
                stockTransfersService.approve(t.id, {
                    sourceBranchId: approve.chosenSourceId,
                    approvedQuantity: t.requestedQuantity,
                    approvalNote: approve.approvalNote.trim() || undefined,
                }),
            'Transfer approved',
            'Failed to approve transfer',
        );
        if (ok) close();
    }, [approve, primary, runForAll, close]);

    const handleBatchApproveSubmit = useCallback(
        async (sources: Record<string, string>, note: string) => {
            for (const t of activeTransfers) {
                if (!sources[t.id]) {
                    toast.error('Pick a source for every product first');
                    return;
                }
            }
            const trimmedNote = note.trim() || undefined;
            const ok = await runForAll(
                (t) =>
                    stockTransfersService.approve(t.id, {
                        sourceBranchId: sources[t.id],
                        approvedQuantity: t.requestedQuantity,
                        approvalNote: trimmedNote,
                    }),
                `Approved ${activeTransfers.length} transfers`,
                'Failed to approve transfers',
            );
            if (ok) close();
        },
        [activeTransfers, runForAll, close],
    );

    const handleRejectSubmit = useCallback(async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a reason');
            return;
        }
        const reason = rejectionReason.trim();
        const ok = await runForAll(
            (t) => stockTransfersService.reject(t.id, reason),
            isBatch
                ? `Rejected ${activeTransfers.length} transfers`
                : 'Transfer rejected',
            'Failed to reject transfer(s)',
        );
        if (ok) close();
    }, [rejectionReason, runForAll, close, activeTransfers.length, isBatch]);

    const handleConfirmAction = useCallback(
        async (action: ConfirmAction) => {
            const successSingle =
                action === 'cancel'
                    ? 'Transfer cancelled'
                    : action === 'ship'
                      ? 'Transfer marked as shipped'
                      : 'Transfer received';
            const successBatch = `${action[0].toUpperCase()}${action.slice(1)}ed ${activeTransfers.length} transfers`;
            const ok = await runForAll(
                (t) =>
                    action === 'cancel'
                        ? stockTransfersService.cancel(t.id)
                        : action === 'ship'
                          ? stockTransfersService.ship(t.id)
                          : stockTransfersService.receive(t.id),
                isBatch ? successBatch : successSingle,
                `Failed to ${action} transfer(s)`,
            );
            if (ok) close();
        },
        [runForAll, close, activeTransfers.length, isBatch],
    );

    return {
        activeAction,
        activeTransfers,
        primary,
        isBatch,
        submitting,
        approve,
        rejectionReason,
        setRejectionReason,
        open,
        close,
        handleSingleApproveSubmit,
        handleBatchApproveSubmit,
        handleRejectSubmit,
        handleConfirmAction,
    };
}

export type BoardActionModalState = ReturnType<typeof useBoardActionModal>;
