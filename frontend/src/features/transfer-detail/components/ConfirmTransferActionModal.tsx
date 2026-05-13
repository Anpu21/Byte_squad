import Modal from '@/components/ui/Modal';
import type { IStockTransferRequest } from '@/types';
import type { ConfirmAction } from '../types/transfer-action.type';

interface ConfirmTransferActionModalProps {
    action: ConfirmAction | null;
    transfer: IStockTransferRequest;
    displayQty: number;
    submitting: boolean;
    onClose: () => void;
    onConfirm: (action: ConfirmAction) => void;
}

const TITLES: Record<ConfirmAction, string> = {
    cancel: 'Cancel transfer',
    ship: 'Mark transfer as shipped',
    receive: 'Mark transfer as received',
};

function bodyFor(
    action: ConfirmAction,
    transfer: IStockTransferRequest,
    displayQty: number,
): string {
    if (action === 'cancel') {
        return 'This will void the transfer. No inventory will move.';
    }
    if (action === 'ship') {
        return `This will deduct ${displayQty} unit(s) of ${transfer.product.name} from ${transfer.sourceBranch?.name ?? 'source branch'}. Continue?`;
    }
    return `This will add ${displayQty} unit(s) of ${transfer.product.name} to ${transfer.destinationBranch.name}. Continue?`;
}

function confirmButtonClass(action: ConfirmAction): string {
    if (action === 'cancel')
        return 'bg-danger-soft border border-danger/40 text-danger hover:bg-danger-soft';
    if (action === 'receive')
        return 'bg-accent-soft border border-accent/40 text-accent-text hover:bg-accent-soft';
    return 'bg-primary text-text-inv hover:bg-primary-hover';
}

export function ConfirmTransferActionModal({
    action,
    transfer,
    displayQty,
    submitting,
    onClose,
    onConfirm,
}: ConfirmTransferActionModalProps) {
    return (
        <Modal
            isOpen={action !== null}
            onClose={onClose}
            title={action ? TITLES[action] : ''}
            maxWidth="md"
        >
            <div>
                {action && (
                    <>
                        <p className="text-sm text-text-2 mb-6">
                            {bodyFor(action, transfer, displayQty)}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="h-9 px-4 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => onConfirm(action)}
                                disabled={submitting}
                                className={`h-9 px-4 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${confirmButtonClass(action)}`}
                            >
                                {submitting ? 'Working…' : 'Confirm'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
