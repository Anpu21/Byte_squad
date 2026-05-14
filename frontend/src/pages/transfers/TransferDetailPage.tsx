import { useTransferDetailPage } from '@/features/transfer-detail/hooks/useTransferDetailPage';
import { TransferDetailHeader } from '@/features/transfer-detail/components/TransferDetailHeader';
import { AuditTimeline } from '@/features/transfer-detail/components/AuditTimeline';
import { TransferReasonsCard } from '@/features/transfer-detail/components/TransferReasonsCard';
import { SourceAvailabilityCard } from '@/features/transfer-detail/components/SourceAvailabilityCard';
import { TransferActionsCard } from '@/features/transfer-detail/components/TransferActionsCard';
import { ApproveTransferModal } from '@/features/transfer-detail/components/ApproveTransferModal';
import { RejectTransferModal } from '@/features/transfer-detail/components/RejectTransferModal';
import { ConfirmTransferActionModal } from '@/features/transfer-detail/components/ConfirmTransferActionModal';
import { TransferDetailSkeleton } from '@/features/transfer-detail/components/TransferDetailSkeleton';
import { TransferNotFound } from '@/features/transfer-detail/components/TransferNotFound';

export function TransferDetailPage() {
    const p = useTransferDetailPage();

    if (p.isLoading) return <TransferDetailSkeleton />;
    if (p.error || !p.transfer || !p.permissions) {
        return <TransferNotFound error={p.error} />;
    }

    const displayQty =
        p.transfer.approvedQuantity ?? p.transfer.requestedQuantity;
    const confirmAction =
        p.activeAction === 'cancel' ||
        p.activeAction === 'ship' ||
        p.activeAction === 'receive'
            ? p.activeAction
            : null;

    return (
        <div className="animate-in fade-in duration-300 max-w-5xl">
            <TransferDetailHeader transfer={p.transfer} displayQty={displayQty} />
            <AuditTimeline transfer={p.transfer} />
            <TransferReasonsCard transfer={p.transfer} />
            {p.permissions.canApproveOrReject && p.id && (
                <SourceAvailabilityCard
                    transferId={p.id}
                    requestedQuantity={p.transfer.requestedQuantity}
                    onChoose={p.openApproveWith}
                />
            )}
            <TransferActionsCard
                permissions={p.permissions}
                onApprove={p.openApprove}
                onChangeAction={p.setActiveAction}
            />

            <ApproveTransferModal
                isOpen={p.activeAction === 'approve'}
                onClose={p.closeModal}
                transfer={p.transfer}
                state={p.approve}
                submitting={p.submitting}
                onSubmit={p.handleApproveSubmit}
            />
            <RejectTransferModal
                isOpen={p.activeAction === 'reject'}
                onClose={p.closeModal}
                reason={p.rejectionReason}
                onReasonChange={p.setRejectionReason}
                submitting={p.submitting}
                onSubmit={p.handleRejectSubmit}
            />
            <ConfirmTransferActionModal
                action={confirmAction}
                transfer={p.transfer}
                displayQty={displayQty}
                submitting={p.submitting}
                onClose={p.closeModal}
                onConfirm={p.handleConfirmAction}
            />
        </div>
    );
}
