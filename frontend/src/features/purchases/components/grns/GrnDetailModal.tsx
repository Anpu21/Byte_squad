import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IGrn } from '@/types';
import { useGrn } from '../../hooks/useGrn';
import { useVoidGrn } from '../../hooks/useVoidGrn';
import { GrnPaymentPill } from './GrnPaymentPill';
import { GrnReturnSection } from './GrnReturnSection';

interface IGrnDetailModalProps {
    grnId: string | null;
    onClose: () => void;
}

/**
 * GRN drill-down: header, received lines, totals, and (admin, while no
 * payment is allocated) a reason-gated void action that reverses stock and
 * the ledger posting.
 */
export function GrnDetailModal({ grnId, onClose }: IGrnDetailModalProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const grnQuery = useGrn(grnId);
    const voidGrn = useVoidGrn();
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);

    const grn: IGrn | undefined = grnQuery.data;
    const canVoid =
        isAdmin &&
        !!grn &&
        grn.status === 'Received' &&
        Number(grn.paidAmount) === 0;

    async function handleVoid() {
        if (!grn || voidReason.trim().length < 3) return;
        try {
            await voidGrn.mutateAsync({
                id: grn.id,
                reason: voidReason.trim(),
            });
            toast.success(`${grn.grnNumber} voided`);
            setVoiding(false);
            setVoidReason('');
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not void GRN');
            } else {
                toast.error('Could not void GRN');
            }
        }
    }

    return (
        <Modal
            isOpen={grnId !== null}
            onClose={onClose}
            title={grn ? grn.grnNumber : 'Goods receipt'}
            maxWidth="lg"
        >
            {!grn ? (
                <p className="text-sm text-text-2">Loading…</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Pill
                            tone={grn.status === 'Received' ? 'info' : 'neutral'}
                        >
                            {grn.status}
                        </Pill>
                        <GrnPaymentPill status={grn.paymentStatus} />
                        <span className="text-xs text-text-3">
                            {grn.supplier?.name} · {grn.branch?.name} · received{' '}
                            {grn.grnDate} · due {grn.dueDate}
                            {grn.supplierInvoiceNo
                                ? ` · supplier inv ${grn.supplierInvoiceNo}`
                                : ''}
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-border rounded-md">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2 font-medium">
                                        Item
                                    </th>
                                    <th className="px-3 py-2 font-medium text-right">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2 font-medium text-right">
                                        Unit cost
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Batch / expiry
                                    </th>
                                    <th className="px-3 py-2 font-medium text-right">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(grn.items ?? []).map((it) => (
                                    <tr
                                        key={it.id}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        <td className="px-3 py-2 text-[13px] text-text-1">
                                            {it.product?.name ?? it.productId}
                                        </td>
                                        <td className="px-3 py-2 text-[13px] text-text-1 text-right tabular-nums">
                                            {Number(it.quantity)}
                                        </td>
                                        <td className="px-3 py-2 text-[13px] text-text-2 text-right tabular-nums">
                                            {formatCurrency(
                                                Number(it.unitCost),
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-[12px] text-text-3">
                                            {it.batchNo ?? '—'}
                                            {it.expiryDate
                                                ? ` · exp ${it.expiryDate}`
                                                : ''}
                                        </td>
                                        <td className="px-3 py-2 text-[13px] text-text-1 text-right tabular-nums">
                                            {formatCurrency(
                                                Number(it.lineTotal),
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-text-2">
                            <span>Subtotal</span>
                            <span className="tabular-nums">
                                {formatCurrency(Number(grn.subTotal))}
                            </span>
                        </div>
                        {Number(grn.discountAmount) > 0 && (
                            <div className="flex justify-between text-text-2">
                                <span>Discount</span>
                                <span className="tabular-nums">
                                    −{formatCurrency(Number(grn.discountAmount))}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border font-semibold text-text-1">
                            <span>Grand total</span>
                            <span className="tabular-nums">
                                {formatCurrency(Number(grn.grandTotal))}
                            </span>
                        </div>
                        <div className="flex justify-between text-text-2">
                            <span>Paid</span>
                            <span className="tabular-nums">
                                {formatCurrency(Number(grn.paidAmount))}
                            </span>
                        </div>
                    </div>

                    {grn.status === 'Voided' && grn.voidReason && (
                        <div className="p-3 rounded-md bg-warning-soft border border-warning/40 text-sm text-warning">
                            Voided — {grn.voidReason}
                        </div>
                    )}

                    <GrnReturnSection grn={grn} onReturned={onClose} />

                    {canVoid && !voiding && (
                        <div className="flex justify-end">
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setVoiding(true)}
                            >
                                Void GRN
                            </Button>
                        </div>
                    )}

                    {canVoid && voiding && (
                        <div className="space-y-2 p-3 rounded-md border border-danger/40 bg-danger-soft/40">
                            <p className="text-xs text-text-2">
                                Voiding reverses the received stock and the
                                ledger posting. Refused if the goods were
                                already sold.
                            </p>
                            <textarea
                                className="w-full min-h-[56px] px-3 py-2 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-danger focus:ring-[3px] focus:ring-danger/20"
                                placeholder="Reason (required)"
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                maxLength={500}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVoiding(false)}
                                    disabled={voidGrn.isPending}
                                >
                                    Keep GRN
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => void handleVoid()}
                                    disabled={
                                        voidGrn.isPending ||
                                        voidReason.trim().length < 3
                                    }
                                >
                                    {voidGrn.isPending
                                        ? 'Voiding…'
                                        : 'Confirm void'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
