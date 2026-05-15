import Modal from '@/components/ui/Modal';
import type { ConfirmAction } from '../types/transfer-action.type';

interface BatchConfirmActionModalProps {
    action: ConfirmAction | null;
    count: number;
    submitting: boolean;
    onClose: () => void;
    onConfirm: (action: ConfirmAction) => void;
}

const TITLES: Record<ConfirmAction, string> = {
    cancel: 'Cancel transfers',
    ship: 'Mark transfers as shipped',
    receive: 'Mark transfers as received',
};

function bodyFor(action: ConfirmAction, count: number): string {
    if (action === 'cancel') {
        return `This will void ${count} transfers in this batch. No inventory will move.`;
    }
    if (action === 'ship') {
        return `This will deduct stock for all ${count} transfers in this batch from their chosen source branches. Continue?`;
    }
    return `This will add stock at the destination branch for all ${count} transfers in this batch. Continue?`;
}

function confirmButtonClass(action: ConfirmAction): string {
    if (action === 'cancel')
        return 'bg-danger-soft border border-danger/40 text-danger hover:bg-danger-soft';
    if (action === 'receive')
        return 'bg-accent-soft border border-accent/40 text-accent-text hover:bg-accent-soft';
    return 'bg-primary text-text-inv hover:bg-primary-hover';
}

export function BatchConfirmActionModal({
    action,
    count,
    submitting,
    onClose,
    onConfirm,
}: BatchConfirmActionModalProps) {
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
                            {bodyFor(action, count)}
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
