import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuSearch as Search } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { returnsService } from '@/services/returns.service';
import type { ICreateSalesReturnLine, ISaleReturnLookup } from '@/types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface IPosReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ILineDraft {
    good: string;
    bad: string;
    restockGood: boolean;
}

/**
 * In-POS sales return: invoice lookup → good/bad split per line →
 * refund. Reuses the inventory returns endpoints (restock + stock
 * movement + refund ledger entry happen server-side); cashiers are
 * branch-pinned by the service.
 */
export function PosReturnModal({ isOpen, onClose }: IPosReturnModalProps) {
    const queryClient = useQueryClient();
    const [invoice, setInvoice] = useState('');
    const [lookup, setLookup] = useState<ISaleReturnLookup | null>(null);
    const [drafts, setDrafts] = useState<Record<string, ILineDraft>>({});
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    function reset() {
        setInvoice('');
        setLookup(null);
        setDrafts({});
        setReason('');
    }

    function close() {
        reset();
        onClose();
    }

    async function handleLookup(e: React.FormEvent) {
        e.preventDefault();
        const code = invoice.trim();
        if (!code || busy) return;
        setBusy(true);
        try {
            const found = await returnsService.lookup(code);
            setLookup(found);
            setDrafts({});
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                toast.error('No sale found for that invoice');
            } else {
                toast.error('Lookup failed');
            }
            setLookup(null);
        } finally {
            setBusy(false);
        }
    }

    const returnableLines = (lookup?.lines ?? []).filter(
        (l) => l.remaining > 0,
    );

    const parsed = returnableLines.map((line) => {
        const draft = drafts[line.saleItemId] ?? {
            good: '',
            bad: '',
            restockGood: true,
        };
        const good = Number(draft.good) || 0;
        const bad = Number(draft.bad) || 0;
        return {
            line,
            draft,
            good,
            bad,
            total: good + bad,
            over: good + bad > line.remaining,
            refund: (good + bad) * Number(line.unitPrice),
        };
    });
    const picked = parsed.filter((p) => p.total > 0);
    const overCap = parsed.some((p) => p.over);
    const refundTotal = picked.reduce((sum, p) => sum + p.refund, 0);
    const canSubmit = picked.length > 0 && !overCap && !busy;

    function patchDraft(saleItemId: string, patch: Partial<ILineDraft>) {
        setDrafts((prev) => {
            const current = prev[saleItemId] ?? {
                good: '',
                bad: '',
                restockGood: true,
            };
            return { ...prev, [saleItemId]: { ...current, ...patch } };
        });
    }

    async function handleSubmit() {
        if (!lookup || !canSubmit) return;
        setBusy(true);
        const lines: ICreateSalesReturnLine[] = picked.map((p) => ({
            saleItemId: p.line.saleItemId,
            goodQuantity: p.good,
            badQuantity: p.bad,
            restockGood: p.draft.restockGood,
        }));
        try {
            const ret = await returnsService.create({
                saleId: lookup.saleId,
                reason: reason.trim() || undefined,
                lines,
            });
            toast.success(
                `Refunded ${formatCurrency(Number(ret.totalRefundAmount))} — ${lookup.invoiceNumber}`,
            );
            void queryClient.invalidateQueries({ queryKey: ['pos'] });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['ledger'] });
            close();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not process the return');
            } else {
                toast.error('Could not process the return');
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            title="Sales return"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            <div className="space-y-4">
                <form onSubmit={handleLookup} className="flex gap-2">
                    <input
                        className={`${INPUT_CLASS} flex-1 font-mono`}
                        value={invoice}
                        onChange={(e) => setInvoice(e.target.value)}
                        placeholder="Invoice number, e.g. INV-2026-000123"
                        aria-label="Invoice number"
                    />
                    <Button type="submit" variant="secondary" disabled={busy}>
                        <Search size={14} aria-hidden />
                        {busy && !lookup ? 'Looking…' : 'Look up'}
                    </Button>
                </form>

                {lookup && (
                    <>
                        <p className="text-xs text-text-3">
                            {lookup.invoiceNumber} · sold{' '}
                            {new Date(lookup.createdAt).toLocaleString()} ·
                            total {formatCurrency(Number(lookup.total))}
                        </p>

                        {returnableLines.length === 0 ? (
                            <p className="p-3 rounded-md bg-warning-soft border border-warning/40 text-sm text-warning">
                                Everything on this invoice has already been
                                returned.
                            </p>
                        ) : (
                            <div className="overflow-x-auto border border-border rounded-md">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-2/60 border-b border-border">
                                        <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                            <th className="px-2 py-2 font-medium">
                                                Item
                                            </th>
                                            <th className="px-2 py-2 font-medium text-right">
                                                Left
                                            </th>
                                            <th className="px-2 py-2 font-medium w-20">
                                                Good
                                            </th>
                                            <th className="px-2 py-2 font-medium w-20">
                                                Bad
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Restock
                                            </th>
                                            <th className="px-2 py-2 font-medium text-right">
                                                Refund
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsed.map(
                                            ({ line, draft, refund, over }) => (
                                                <tr
                                                    key={line.saleItemId}
                                                    className="border-b border-border last:border-b-0"
                                                >
                                                    <td className="px-2 py-1.5 text-[13px] text-text-1">
                                                        {line.productName}
                                                        <span className="block text-[11px] text-text-3">
                                                            {formatCurrency(
                                                                Number(
                                                                    line.unitPrice,
                                                                ),
                                                            )}{' '}
                                                            / {line.unitLabel ??
                                                                'unit'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right text-[13px] tabular-nums text-text-2">
                                                        {line.remaining}
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input
                                                            className={`${INPUT_CLASS} w-full h-8 text-right ${over ? 'border-danger' : ''}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            value={draft.good}
                                                            onChange={(e) =>
                                                                patchDraft(
                                                                    line.saleItemId,
                                                                    {
                                                                        good: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                )
                                                            }
                                                            aria-label={`Good quantity for ${line.productName}`}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input
                                                            className={`${INPUT_CLASS} w-full h-8 text-right ${over ? 'border-danger' : ''}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            value={draft.bad}
                                                            onChange={(e) =>
                                                                patchDraft(
                                                                    line.saleItemId,
                                                                    {
                                                                        bad: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                )
                                                            }
                                                            aria-label={`Bad quantity for ${line.productName}`}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                draft.restockGood
                                                            }
                                                            onChange={(e) =>
                                                                patchDraft(
                                                                    line.saleItemId,
                                                                    {
                                                                        restockGood:
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                    },
                                                                )
                                                            }
                                                            aria-label={`Restock good units of ${line.productName}`}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1.5 text-right text-[13px] tabular-nums text-text-1">
                                                        {refund > 0
                                                            ? formatCurrency(
                                                                  refund,
                                                              )
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <input
                            className={`${INPUT_CLASS} w-full`}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason (optional)"
                            maxLength={255}
                            aria-label="Return reason"
                        />

                        <div className="flex items-center justify-end gap-3">
                            {overCap && (
                                <span className="text-xs text-danger">
                                    A line exceeds its returnable remainder.
                                </span>
                            )}
                            <span className="text-sm text-text-2">
                                Refund:{' '}
                                <span className="font-semibold text-text-1 tabular-nums">
                                    {formatCurrency(refundTotal)}
                                </span>
                            </span>
                            <Button
                                variant="primary"
                                onClick={() => void handleSubmit()}
                                disabled={!canSubmit}
                            >
                                {busy ? 'Processing…' : 'Refund & restock'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
