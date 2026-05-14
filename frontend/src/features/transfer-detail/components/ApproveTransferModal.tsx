import Modal from '@/components/ui/Modal';
import type { IStockTransferRequest } from '@/types';
import type { ApproveModalState } from '../hooks/useApproveTransferModal';
import { SourceOptionsTable } from './SourceOptionsTable';

interface ApproveTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    transfer: IStockTransferRequest;
    state: ApproveModalState;
    submitting: boolean;
    onSubmit: () => void;
}

export function ApproveTransferModal({
    isOpen,
    onClose,
    transfer,
    state,
    submitting,
    onSubmit,
}: ApproveTransferModalProps) {
    const chosenSource = state.sourceOptions.find(
        (opt) => opt.branchId === state.chosenSourceId,
    );
    const parsedQty = Number.parseInt(state.approvedQuantityStr, 10);
    const qtyIsNumber = !Number.isNaN(parsedQty);
    const qtyInRange =
        qtyIsNumber &&
        parsedQty >= 1 &&
        parsedQty <= transfer.requestedQuantity;
    const qtyWithinStock =
        qtyIsNumber && chosenSource
            ? parsedQty <= chosenSource.currentQuantity
            : false;
    const canSubmit =
        Boolean(chosenSource) && qtyInRange && qtyWithinStock;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Approve transfer" maxWidth="2xl">
            <div>
                <p className="text-xs text-text-3 mb-4">
                    Pick a source branch with enough stock and confirm the
                    quantity.
                </p>

                <div className="bg-canvas border border-border rounded-xl max-h-72 overflow-y-auto mb-4">
                    <SourceOptionsTable
                        options={state.sourceOptions}
                        isLoading={state.sourceLoading}
                        requestedQuantity={transfer.requestedQuantity}
                        chosenSourceId={state.chosenSourceId}
                        onChoose={state.setChosenSourceId}
                    />
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="approved-qty"
                        className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2"
                    >
                        Approved quantity
                    </label>
                    <input
                        id="approved-qty"
                        type="number"
                        min={1}
                        max={transfer.requestedQuantity}
                        value={state.approvedQuantityStr}
                        onChange={(e) =>
                            state.setApprovedQuantityStr(e.target.value)
                        }
                        className="w-full h-11 px-4 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all"
                    />
                    <p className="text-[11px] text-text-3 mt-1">
                        Requested: {transfer.requestedQuantity} unit(s)
                    </p>
                    {chosenSource && (
                        <p
                            className={`text-[11px] mt-1 ${
                                qtyWithinStock
                                    ? 'text-text-3'
                                    : 'text-warning font-medium'
                            }`}
                        >
                            {chosenSource.branchName} has{' '}
                            {chosenSource.currentQuantity} unit(s) in stock.
                            {!qtyWithinStock && qtyIsNumber
                                ? ` — over by ${parsedQty - chosenSource.currentQuantity}.`
                                : ''}
                        </p>
                    )}
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="approval-note"
                        className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2"
                    >
                        Verification message to managers (optional)
                    </label>
                    <textarea
                        id="approval-note"
                        value={state.approvalNote}
                        onChange={(e) => state.setApprovalNote(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="e.g. Please ship before Friday — store running out."
                        className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 resize-none"
                    />
                    <p className="text-[11px] text-text-3 mt-1">
                        Sent to both source and destination branch managers in
                        the approval notification.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3">
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
                        disabled={submitting || !canSubmit}
                        className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Approving…' : 'Confirm approval'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
