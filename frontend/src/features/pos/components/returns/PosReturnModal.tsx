import { useState } from 'react';
import { LuSearch as Search } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Segmented from '@/components/ui/Segmented';
import { formatCurrency } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { ReplacementItemsPicker } from '@/features/returns/components/ReplacementItemsPicker';
import { ExchangeSettlementPanel } from '@/features/returns/components/ExchangeSettlementPanel';
import { usePosReturn } from './usePosReturn';
import { usePosExchange } from './usePosExchange';
import { PosReturnLinesTable } from './PosReturnLinesTable';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

type ReturnMode = 'refund' | 'exchange';
const MODE_OPTIONS: { label: string; value: ReturnMode }[] = [
    { label: 'Refund', value: 'refund' },
    { label: 'Exchange', value: 'exchange' },
];

interface IPosReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * In-POS sales return / exchange: invoice lookup → good/bad split per line →
 * either a refund (restock + refund ledger) or an exchange (return + a
 * replacement sale, net-cash settled). All inventory/ledger writes are
 * server-side; cashiers are branch-pinned by the service.
 */
export function PosReturnModal({ isOpen, onClose }: IPosReturnModalProps) {
    const r = usePosReturn(onClose);
    const [mode, setMode] = useState<ReturnMode>('refund');
    const x = usePosExchange({
        saleId: r.lookup?.saleId ?? null,
        returnedValue: r.refundTotal,
        hasReturnLines: r.hasReturnLines,
        buildReturnLines: r.buildReturnLines,
        reason: r.reason,
        onDone: r.close,
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={r.close}
            title="Sales return / exchange"
            maxWidth="2xl"
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
                            <>
                                <Segmented
                                    value={mode}
                                    options={MODE_OPTIONS}
                                    onChange={setMode}
                                />
                                <PosReturnLinesTable
                                    parsed={r.parsed}
                                    onPatchDraft={r.patchDraft}
                                    onPatchQty={r.patchQty}
                                />
                                <input
                                    className={`${INPUT_CLASS} w-full`}
                                    value={r.reason}
                                    onChange={(e) => r.setReason(e.target.value)}
                                    placeholder="Reason (optional)"
                                    maxLength={255}
                                    aria-label="Return reason"
                                />

                                {mode === 'refund' ? (
                                    <div className="flex items-center justify-end gap-3">
                                        {r.overCap && (
                                            <span className="text-xs text-danger">
                                                A line exceeds its returnable
                                                remainder.
                                            </span>
                                        )}
                                        <span className="text-sm text-text-2">
                                            Refund:{' '}
                                            <span className="font-semibold text-text-1 num">
                                                {formatCurrency(r.refundTotal)}
                                            </span>
                                        </span>
                                        <Button
                                            variant="primary"
                                            onClick={() => void r.handleSubmit()}
                                            disabled={!r.canSubmit}
                                        >
                                            {r.busy
                                                ? 'Processing…'
                                                : 'Refund & restock'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <ReplacementItemsPicker
                                            lines={x.replacement.lines}
                                            total={x.replacement.total}
                                            onAdd={x.replacement.addFromSearch}
                                            onSetQuantity={
                                                x.replacement.setQuantity
                                            }
                                            onSetUnit={x.replacement.setUnit}
                                            onRemove={x.replacement.removeItem}
                                        />
                                        <ExchangeSettlementPanel
                                            returnedValue={r.refundTotal}
                                            replacementValue={
                                                x.replacement.total
                                            }
                                            method={x.method}
                                            onMethodChange={x.setMethod}
                                            cashTendered={x.cashTendered}
                                            onCashTenderedChange={
                                                x.setCashTendered
                                            }
                                        />
                                        <div className="flex items-center justify-end gap-3">
                                            {r.overCap && (
                                                <span className="text-xs text-danger">
                                                    A line exceeds its returnable
                                                    remainder.
                                                </span>
                                            )}
                                            <Button
                                                variant="primary"
                                                onClick={() =>
                                                    void x.handleSubmit()
                                                }
                                                disabled={!x.canSubmit}
                                            >
                                                {x.busy
                                                    ? 'Processing…'
                                                    : 'Process exchange'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
