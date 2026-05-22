import Modal from '@/components/ui/Modal';

interface RejectTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: string;
    onReasonChange: (value: string) => void;
    submitting: boolean;
    onSubmit: () => void;
}

export function RejectTransferModal({
    isOpen,
    onClose,
    reason,
    onReasonChange,
    submitting,
    onSubmit,
}: RejectTransferModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reject transfer" maxWidth="md">
            <div>
                <p className="text-xs text-text-3 mb-4">
                    The requesting branch will see this reason.
                </p>
                <label htmlFor="rejection-reason" className="sr-only">
                    Reason for rejection
                </label>
                <textarea
                    id="rejection-reason"
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Reason for rejection…"
                    className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 resize-none"
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="h-9 px-4 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="h-9 px-4 rounded-lg bg-danger-soft border border-danger/40 text-danger text-sm font-medium hover:bg-danger-soft transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Rejecting…' : 'Reject transfer'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
