import { LuSearch as Search } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { usePosReturn } from './usePosReturn';
import { PosReturnLinesTable } from './PosReturnLinesTable';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface IPosReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * In-POS sales return: invoice lookup → good/bad split per line →
 * refund. Reuses the inventory returns endpoints (restock + stock
 * movement + refund ledger entry happen server-side); cashiers are
 * branch-pinned by the service.
 */
export function PosReturnModal({ isOpen, onClose }: IPosReturnModalProps) {
    const r = usePosReturn(onClose);

    return (
        <Modal
            isOpen={isOpen}
            onClose={r.close}
            title="Sales return"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            <div className="space-y-4">
                <form onSubmit={r.handleLookup} className="flex gap-2">
                    <input
                        className={`${INPUT_CLASS} flex-1 font-mono`}
                        value={r.invoice}
                        onChange={(e) => r.setInvoice(e.target.value)}
                        placeholder="Invoice number, e.g. INV-2026-000123"
                        aria-label="Invoice number"
                    />
                    <Button type="submit" variant="secondary" disabled={r.busy}>
                        <Search size={14} aria-hidden />
                        {r.busy && !r.lookup ? 'Looking…' : 'Look up'}
                    </Button>
                </form>

                {r.lookup && (
                    <>
                        <p className="text-xs text-text-3">
                            {r.lookup.invoiceNumber} · sold{' '}
                            {new Date(r.lookup.createdAt).toLocaleString()} ·
                            total {formatCurrency(Number(r.lookup.total))}
                        </p>

                        {r.returnableLines.length === 0 ? (
                            <p className="p-3 rounded-md bg-warning-soft border border-warning/40 text-sm text-warning">
                                Everything on this invoice has already been
                                returned.
                            </p>
                        ) : (
                            <PosReturnLinesTable
                                parsed={r.parsed}
                                onPatchDraft={r.patchDraft}
                                onPatchQty={r.patchQty}
                            />
                        )}

                        <input
                            className={`${INPUT_CLASS} w-full`}
                            value={r.reason}
                            onChange={(e) => r.setReason(e.target.value)}
                            placeholder="Reason (optional)"
                            maxLength={255}
                            aria-label="Return reason"
                        />

                        <div className="flex items-center justify-end gap-3">
                            {r.overCap && (
                                <span className="text-xs text-danger">
                                    A line exceeds its returnable remainder.
                                </span>
                            )}
                            <span className="text-sm text-text-2">
                                Refund:{' '}
                                <span className="font-semibold text-text-1 tabular-nums">
                                    {formatCurrency(r.refundTotal)}
                                </span>
                            </span>
                            <Button
                                variant="primary"
                                onClick={() => void r.handleSubmit()}
                                disabled={!r.canSubmit}
                            >
                                {r.busy ? 'Processing…' : 'Refund & restock'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
