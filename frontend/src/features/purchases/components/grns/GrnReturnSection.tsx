import { useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuUndo2 as Undo2 } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IGrn } from '@/types';
import { usePurchaseReturns } from '../../hooks/usePurchaseReturns';
import { useCreatePurchaseReturn } from '../../hooks/useCreatePurchaseReturn';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-8 px-2`;

interface IGrnReturnSectionProps {
    grn: IGrn;
    /** Called after a successful debit note (parent refreshes/closes). */
    onReturned: () => void;
}

/**
 * Debit-note section of the GRN detail: prior returns for this bill plus
 * an inline form — per received line, how many go back and why. Costs
 * are taken from the GRN line server-side.
 */
export function GrnReturnSection({ grn, onReturned }: IGrnReturnSectionProps) {
    const returnsQuery = usePurchaseReturns(grn.id);
    const createReturn = useCreatePurchaseReturn();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [qty, setQty] = useState<Record<string, string>>({});

    const priorReturns = useMemo(
        () => returnsQuery.data ?? [],
        [returnsQuery.data],
    );
    const returnedByProduct = useMemo(() => {
        const map = new Map<string, number>();
        for (const ret of priorReturns) {
            for (const item of ret.items ?? []) {
                map.set(
                    item.productId,
                    (map.get(item.productId) ?? 0) + Number(item.quantity),
                );
            }
        }
        return map;
    }, [priorReturns]);

    const entries = (grn.items ?? [])
        .map((item) => {
            const returnable =
                Number(item.quantity) -
                (returnedByProduct.get(item.productId) ?? 0);
            return {
                item,
                returnable,
                entered: Number(qty[item.productId] ?? ''),
            };
        })
        .filter((e) => e.returnable > 0);

    const picked = entries.filter(
        (e) => Number.isFinite(e.entered) && e.entered > 0,
    );
    const overCap = picked.some((e) => e.entered > e.returnable);
    const total = picked.reduce(
        (sum, e) => sum + e.entered * Number(e.item.unitCost),
        0,
    );
    const canSubmit =
        picked.length > 0 && !overCap && reason.trim().length >= 3;

    async function handleSubmit() {
        if (!canSubmit || createReturn.isPending) return;
        try {
            const ret = await createReturn.mutateAsync({
                grnId: grn.id,
                reason: reason.trim(),
                items: picked.map((e) => ({
                    productId: e.item.productId,
                    quantity: e.entered,
                })),
            });
            toast.success(
                `${ret.returnNumber} recorded — ${formatCurrency(Number(ret.total))} off ${grn.grnNumber}`,
            );
            setOpen(false);
            setReason('');
            setQty({});
            onReturned();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not record the return');
            } else {
                toast.error('Could not record the return');
            }
        }
    }

    return (
        <div className="space-y-3">
            {priorReturns.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-text-3">
                        Debit notes
                    </p>
                    {priorReturns.map((ret) => (
                        <div
                            key={ret.id}
                            className="flex items-center justify-between text-[13px] text-text-2"
                        >
                            <span className="mono">{ret.returnNumber}</span>
                            <span className="truncate px-2">{ret.reason}</span>
                            <span className="tabular-nums text-text-1">
                                −{formatCurrency(Number(ret.total))}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {grn.status === 'Received' && !open && entries.length > 0 && (
                <div className="flex justify-end">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpen(true)}
                    >
                        <Undo2 size={14} aria-hidden />
                        Return items
                    </Button>
                </div>
            )}

            {open && (
                <div className="space-y-2 p-3 rounded-md border border-border bg-surface-2/40">
                    <p className="text-xs text-text-2">
                        Goods go back to the supplier: stock out and the bill
                        shrinks by the return value (at GRN cost).
                    </p>
                    {entries.map(({ item, returnable }) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 text-[13px]"
                        >
                            <span className="flex-1 truncate text-text-1">
                                {item.product?.name ?? item.productId}
                            </span>
                            <span className="text-text-3 text-[12px]">
                                returnable {returnable}
                            </span>
                            <input
                                className={`${INPUT_CLASS} w-24 text-right`}
                                type="number"
                                min="0"
                                step="0.001"
                                max={returnable}
                                value={qty[item.productId] ?? ''}
                                onChange={(e) =>
                                    setQty((prev) => ({
                                        ...prev,
                                        [item.productId]: e.target.value,
                                    }))
                                }
                                aria-label={`Return quantity for ${item.product?.name ?? item.productId}`}
                            />
                        </div>
                    ))}
                    <textarea
                        className={`${FIELD_SHELL} ${FIELD_BORDER} w-full min-h-[48px] px-3 py-2`}
                        placeholder="Reason (required)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={500}
                    />
                    <div className="flex items-center justify-end gap-2">
                        {overCap && (
                            <span className="text-xs text-danger">
                                A quantity exceeds its returnable remainder.
                            </span>
                        )}
                        <span className="text-sm text-text-2">
                            Value:{' '}
                            <span className="font-semibold text-text-1 tabular-nums">
                                {formatCurrency(total)}
                            </span>
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            disabled={createReturn.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit || createReturn.isPending}
                        >
                            {createReturn.isPending
                                ? 'Recording…'
                                : 'Record debit note'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
