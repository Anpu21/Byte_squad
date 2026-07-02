import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { returnsService } from '@/services/returns.service';
import type { ICreateSalesReturnLine, ISaleReturnLookup } from '@/types';

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}
function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}

export interface ILineDraft {
    good: string;
    bad: string;
    restockGood: boolean;
}

export interface ParsedReturnLine {
    line: ISaleReturnLookup['lines'][number];
    draft: ILineDraft;
    good: number;
    bad: number;
    total: number;
    over: boolean;
    refund: number;
}

/**
 * In-POS sales-return state: invoice lookup, per-line good/bad split with
 * over-return guards, and the refund submit (restock + stock movement + refund
 * ledger entry happen server-side).
 */
export function usePosReturn(onClose: () => void) {
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

    const parsed: ParsedReturnLine[] = returnableLines.map((line) => {
        const draft = drafts[line.saleItemId] ?? {
            good: '',
            bad: '',
            restockGood: true,
        };
        const good = Number(draft.good) || 0;
        const bad = Number(draft.bad) || 0;
        const total = round3(good + bad);
        // Discount-aware per-unit price, matching the backend refund basis
        // (returns.service.ts uses lineTotal / quantitySold, not unitPrice).
        const perUnit =
            line.quantitySold > 0
                ? Number(line.lineTotal) / line.quantitySold
                : Number(line.unitPrice);
        return {
            line,
            draft,
            good,
            bad,
            total,
            over: total > line.remaining + 1e-9,
            // Clamp defensively so an over-cap line can never inflate the refund.
            refund: round2(Math.min(total, line.remaining) * perUnit),
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

    /**
     * Clamp a good/bad quantity so `good + bad` can never exceed the line's
     * returnable remainder — the root-cause guard for the over-refund bug.
     * An empty string passes through so the field can be cleared.
     */
    function patchQty(saleItemId: string, field: 'good' | 'bad', raw: string) {
        const applyValue = (value: string) =>
            patchDraft(
                saleItemId,
                field === 'good' ? { good: value } : { bad: value },
            );
        if (raw === '') {
            applyValue('');
            return;
        }
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) return;
        const line = returnableLines.find((l) => l.saleItemId === saleItemId);
        if (!line) {
            applyValue(raw);
            return;
        }
        const current = drafts[saleItemId];
        const sibling =
            Number(field === 'good' ? current?.bad : current?.good) || 0;
        const maxThis = Math.max(0, round3(line.remaining - sibling));
        applyValue(String(Math.min(round3(n), maxThis)));
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

    return {
        invoice,
        setInvoice,
        lookup,
        reason,
        setReason,
        busy,
        close,
        handleLookup,
        returnableLines,
        parsed,
        overCap,
        refundTotal,
        canSubmit,
        patchDraft,
        patchQty,
        handleSubmit,
    };
}
