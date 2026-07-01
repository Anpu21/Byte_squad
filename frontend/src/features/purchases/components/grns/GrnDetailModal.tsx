import { LuPrinter as Printer } from 'react-icons/lu';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import { DataTable } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import {
    buildLabelSheetHtml,
    unitPriceSuffix,
} from '@/features/labels/lib/label-sheet-html';
import type { ILabelItem } from '@/features/labels/lib/label-sheet-html';
import { usePrintLabelSheet } from '@/features/labels/hooks/usePrintLabelSheet';
import type { IGrn } from '@/types';
import { useGrn } from '../../hooks/useGrn';
import { GrnPaymentPill } from './GrnPaymentPill';
import { GrnReturnSection } from './GrnReturnSection';
import { GRN_LINE_COLUMNS } from './grn-line-columns';
import { GrnVoidSection } from './GrnVoidSection';

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
    const { printLabelSheet } = usePrintLabelSheet();

    const grn: IGrn | undefined = grnQuery.data;
    const canVoid =
        isAdmin &&
        !!grn &&
        grn.status === 'Received' &&
        Number(grn.paidAmount) === 0;

    /** One price/barcode label per received line, carrying its batch & expiry. */
    function handlePrintLabels() {
        const items = grn?.items ?? [];
        if (items.length === 0) return;
        const labels: ILabelItem[] = items.map((it) => {
            const plu = it.product?.pluCode;
            return {
                name: it.product?.name ?? it.productId,
                barcode: it.product?.barcode ?? '',
                price: Number(it.product?.sellingPrice ?? 0),
                unitSuffix: unitPriceSuffix(it.product?.baseUnit ?? '') || undefined,
                secondaryLine: plu ? `PLU ${plu}` : undefined,
                batchNo: it.batchNo,
                expiryDate: it.expiryDate,
            };
        });
        printLabelSheet(buildLabelSheetHtml(labels));
        toast.success(
            `Sent ${labels.length} label${labels.length === 1 ? '' : 's'} to print`,
        );
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

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-text-3">
                            Received lines
                        </span>
                        {(grn.items?.length ?? 0) > 0 && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePrintLabels}
                            >
                                <Printer size={14} aria-hidden />
                                Print labels
                            </Button>
                        )}
                    </div>

                    <div className="border border-border rounded-md overflow-hidden">
                        <DataTable
                            columns={GRN_LINE_COLUMNS}
                            rows={grn.items ?? []}
                            getRowKey={(it) => it.id}
                            zebra
                        />
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

                    <GrnVoidSection
                        grn={grn}
                        canVoid={canVoid}
                        onClose={onClose}
                    />
                </div>
            )}
        </Modal>
    );
}
