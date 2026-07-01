import { LuPlus as Plus } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IPurchaseOrder } from '@/types';
import { useNewGrn } from './useNewGrn';
import { GrnLineTable } from './GrnLineTable';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface INewGrnPanelProps {
    /** Called after a successful receive (e.g. jump to the GRN register). */
    onCreated: () => void;
    /**
     * Receiving a purchase order: supplier/branch lock to the PO and the
     * lines pre-fill from it. Mount with a `key` of the PO id so the
     * lazy initial state applies.
     */
    prefillOrder?: IPurchaseOrder | null;
}

/**
 * Goods-receipt entry: supplier + invoice header, then received lines
 * (product, qty, unit cost, optional batch/expiry). One submit records
 * stock IN, weighted-average cost, batches, movements, the ledger debit,
 * and the supplier bill.
 */
export function NewGrnPanel({
    onCreated,
    prefillOrder = null,
}: INewGrnPanelProps) {
    const g = useNewGrn({ prefillOrder, onCreated });

    return (
        <Card className="p-5">
            <form onSubmit={g.handleSubmit} className="space-y-5">
                {prefillOrder && (
                    <div className="p-3 rounded-md bg-info-soft border border-info/40 text-sm text-info">
                        Receiving {prefillOrder.poNumber} — supplier and lines
                        pre-filled; adjust quantities/costs to what actually
                        arrived.
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Supplier
                        </span>
                        <select
                            className={`${INPUT_CLASS} field-select w-full`}
                            value={g.supplierId}
                            onChange={(e) => g.setSupplierId(e.target.value)}
                            disabled={prefillOrder !== null}
                            required
                        >
                            <option value="" disabled>
                                {g.suppliersQuery.isLoading
                                    ? 'Loading…'
                                    : 'Select supplier'}
                            </option>
                            {(g.suppliersQuery.data?.rows ?? []).map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {g.isAdmin && (
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Receiving branch
                            </span>
                            <select
                                className={`${INPUT_CLASS} field-select w-full`}
                                value={g.branchId}
                                onChange={(e) => g.setBranchId(e.target.value)}
                                disabled={prefillOrder !== null}
                                required
                            >
                                <option value="" disabled>
                                    {g.branchesQuery.isLoading
                                        ? 'Loading…'
                                        : 'Select branch'}
                                </option>
                                {(g.branchesQuery.data ?? [])
                                    .filter((b) => b.isActive)
                                    .map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    )}
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            GRN date
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full${g.grnDate ? '' : ' date-empty'}`}
                            type="date"
                            value={g.grnDate}
                            onChange={(e) => g.setGrnDate(e.target.value)}
                        />
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Supplier invoice #
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full`}
                            value={g.supplierInvoiceNo}
                            onChange={(e) =>
                                g.setSupplierInvoiceNo(e.target.value)
                            }
                            placeholder="Their paper invoice no."
                            maxLength={64}
                        />
                    </label>
                </div>

                <GrnLineTable
                    lines={g.parsedLines}
                    products={g.products}
                    productsLoading={g.productsQuery.isLoading}
                    onPickProduct={g.pickProduct}
                    onPatchLine={g.patchLine}
                    onRemoveLine={g.removeLine}
                />
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={g.addLine}
                >
                    <Plus size={14} aria-hidden />
                    Add line
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Notes (optional)
                        </span>
                        <textarea
                            className={`${FIELD_SHELL} ${FIELD_BORDER} w-full min-h-[56px] px-3 py-2`}
                            value={g.notes}
                            onChange={(e) => g.setNotes(e.target.value)}
                            maxLength={1000}
                        />
                    </label>
                    <div className="space-y-2 sm:justify-self-end sm:min-w-[260px]">
                        <div className="flex items-center justify-between text-sm text-text-2">
                            <span>Subtotal</span>
                            <span className="tabular-nums">
                                {formatCurrency(g.subTotal)}
                            </span>
                        </div>
                        <label className="flex items-center justify-between gap-3 text-sm text-text-2">
                            <span>Discount</span>
                            <input
                                className={`${INPUT_CLASS} h-8 w-28 text-right`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={g.discount}
                                onChange={(e) => g.setDiscount(e.target.value)}
                                aria-label="Discount amount"
                            />
                        </label>
                        <div className="flex items-center justify-between pt-2 border-t border-border text-text-1 font-semibold">
                            <span>Grand total</span>
                            <span className="tabular-nums">
                                {formatCurrency(Math.max(g.grandTotal, 0))}
                            </span>
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={!g.canSubmit || g.isPending}
                        >
                            {g.isPending
                                ? 'Receiving…'
                                : `Receive & bill ${formatCurrency(Math.max(g.grandTotal, 0))}`}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}
