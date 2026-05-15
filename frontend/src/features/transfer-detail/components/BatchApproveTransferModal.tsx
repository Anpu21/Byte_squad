import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { IStockTransferRequest } from '@/types';
import { BatchApproveRow } from './BatchApproveRow';

interface BatchApproveTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    transfers: IStockTransferRequest[];
    submitting: boolean;
    onSubmit: (sources: Record<string, string>, note: string) => void;
}

export function BatchApproveTransferModal({
    isOpen,
    onClose,
    transfers,
    submitting,
    onSubmit,
}: BatchApproveTransferModalProps) {
    const [sources, setSources] = useState<Record<string, string>>({});
    const [note, setNote] = useState('');

    const allChosen =
        transfers.length > 0 && transfers.every((t) => Boolean(sources[t.id]));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Approve ${transfers.length} transfers`}
            maxWidth="2xl"
        >
            <div>
                <p className="text-xs text-text-3 mb-4">
                    Pick a source branch for each product. The requested
                    quantity will be approved as-is.
                </p>

                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {transfers.map((t) => (
                        <BatchApproveRow
                            key={t.id}
                            transfer={t}
                            chosenSourceId={sources[t.id] ?? ''}
                            onChoose={(branchId) =>
                                setSources((prev) => ({
                                    ...prev,
                                    [t.id]: branchId,
                                }))
                            }
                            isOpen={isOpen}
                        />
                    ))}
                </div>

                <div className="mt-4">
                    <label
                        htmlFor="batch-approval-note"
                        className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2"
                    >
                        Verification message to managers (optional)
                    </label>
                    <textarea
                        id="batch-approval-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="e.g. Please ship before Friday — store running out."
                        className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 resize-none"
                    />
                    <p className="text-[11px] text-text-3 mt-1">
                        Applied to every transfer in this batch.
                    </p>
                </div>

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
                        onClick={() => onSubmit(sources, note)}
                        disabled={submitting || !allChosen}
                        className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                    >
                        {submitting
                            ? 'Approving…'
                            : `Approve ${transfers.length} transfers`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
