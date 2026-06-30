import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuPlus as Plus, LuTrash2 as Trash2 } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { inventoryService } from '@/services/inventory.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IGrnItemPayload, IPurchaseOrder } from '@/types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useCreateGrn } from '../../hooks/useCreateGrn';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface ILineDraft {
    key: number;
    productId: string;
    quantity: string;
    unitCost: string;
    batchNo: string;
    expiryDate: string;
}

let lineKey = 0;
const emptyLine = (): ILineDraft => ({
    key: ++lineKey,
    productId: '',
    quantity: '',
    unitCost: '',
    batchNo: '',
    expiryDate: '',
});

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
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const createGrn = useCreateGrn();

    const [supplierId, setSupplierId] = useState(
        prefillOrder?.supplierId ?? '',
    );
    const [branchId, setBranchId] = useState(prefillOrder?.branchId ?? '');
    const [grnDate, setGrnDate] = useState('');
    const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
    const [discount, setDiscount] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<ILineDraft[]>(() =>
        prefillOrder?.items?.length
            ? prefillOrder.items.map((it) => ({
                  key: ++lineKey,
                  productId: it.productId,
                  quantity: String(Number(it.quantity)),
                  unitCost: String(Number(it.unitCost)),
                  batchNo: '',
                  expiryDate: '',
              }))
            : [emptyLine()],
    );

    const suppliersQuery = useSuppliers({ status: 'Active', limit: 100 });
    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });

    const products = useMemo(
        () => productsQuery.data ?? [],
        [productsQuery.data],
    );
    const productById = useMemo(
        () => new Map(products.map((p) => [p.id, p])),
        [products],
    );

    function patchLine(key: number, patch: Partial<ILineDraft>) {
        setLines((prev) =>
            prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
    }

    function pickProduct(key: number, productId: string) {
        const product = productById.get(productId);
        // Prefill the unit cost with the current weighted-average cost —
        // the receiver corrects it from the supplier invoice when it moved.
        patchLine(key, {
            productId,
            unitCost: product ? String(product.costPrice) : '',
        });
    }

    function removeLine(key: number) {
        setLines((prev) =>
            prev.length > 1 ? prev.filter((l) => l.key !== key) : prev,
        );
    }

    const parsedLines = lines.map((l) => ({
        ...l,
        qtyNum: Number(l.quantity),
        costNum: Number(l.unitCost),
    }));
    const completeLines = parsedLines.filter(
        (l) =>
            l.productId &&
            Number.isFinite(l.qtyNum) &&
            l.qtyNum > 0 &&
            Number.isFinite(l.costNum) &&
            l.costNum >= 0,
    );
    const subTotal = completeLines.reduce(
        (sum, l) => sum + l.qtyNum * l.costNum,
        0,
    );
    const discountNum = discount === '' ? 0 : Number(discount);
    const grandTotal = subTotal - (Number.isFinite(discountNum) ? discountNum : 0);

    const canSubmit =
        supplierId.length > 0 &&
        (!isAdmin || branchId.length > 0) &&
        completeLines.length === parsedLines.length &&
        completeLines.length > 0 &&
        Number.isFinite(discountNum) &&
        discountNum >= 0 &&
        grandTotal >= 0;

    function reset() {
        setSupplierId('');
        setBranchId('');
        setGrnDate('');
        setSupplierInvoiceNo('');
        setDiscount('');
        setNotes('');
        setLines([emptyLine()]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || createGrn.isPending) return;
        const items: IGrnItemPayload[] = completeLines.map((l) => ({
            productId: l.productId,
            quantity: l.qtyNum,
            unitCost: l.costNum,
            batchNo: l.batchNo.trim() || undefined,
            expiryDate: l.expiryDate || undefined,
        }));
        try {
            const grn = await createGrn.mutateAsync({
                supplierId,
                branchId: isAdmin ? branchId : undefined,
                purchaseOrderId: prefillOrder?.id,
                grnDate: grnDate || undefined,
                supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
                discountAmount: discountNum > 0 ? discountNum : undefined,
                notes: notes.trim() || undefined,
                items,
            });
            toast.success(`${grn.grnNumber} received — stock updated`);
            reset();
            onCreated();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not record the receipt');
            } else {
                toast.error('Could not record the receipt');
            }
        }
    }

    return (
        <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            disabled={prefillOrder !== null}
                            required
                        >
                            <option value="" disabled>
                                {suppliersQuery.isLoading
                                    ? 'Loading…'
                                    : 'Select supplier'}
                            </option>
                            {(suppliersQuery.data?.rows ?? []).map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {isAdmin && (
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Receiving branch
                            </span>
                            <select
                                className={`${INPUT_CLASS} field-select w-full`}
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                disabled={prefillOrder !== null}
                                required
                            >
                                <option value="" disabled>
                                    {branchesQuery.isLoading
                                        ? 'Loading…'
                                        : 'Select branch'}
                                </option>
                                {(branchesQuery.data ?? [])
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
                            className={`${INPUT_CLASS} w-full${(grnDate) ? '' : ' date-empty'}`}
                            type="date"
                            value={grnDate}
                            onChange={(e) => setGrnDate(e.target.value)}
                        />
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Supplier invoice #
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full`}
                            value={supplierInvoiceNo}
                            onChange={(e) =>
                                setSupplierInvoiceNo(e.target.value)
                            }
                            placeholder="Their paper invoice no."
                            maxLength={64}
                        />
                    </label>
                </div>

                <div className="overflow-x-auto border border-border rounded-md">
                    <table className="w-full text-left">
                        <thead className="bg-surface-2/60 border-b border-border">
                            <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                <th className="px-2 py-2 font-medium min-w-[220px]">
                                    Item
                                </th>
                                <th className="px-2 py-2 font-medium w-24">
                                    Qty
                                </th>
                                <th className="px-2 py-2 font-medium w-28">
                                    Unit cost
                                </th>
                                <th className="px-2 py-2 font-medium w-28">
                                    Batch no
                                </th>
                                <th className="px-2 py-2 font-medium w-36">
                                    Expiry
                                </th>
                                <th className="px-2 py-2 font-medium text-right w-28">
                                    Amount
                                </th>
                                <th className="px-2 py-2 w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {parsedLines.map((line) => (
                                <tr
                                    key={line.key}
                                    className="border-b border-border last:border-b-0"
                                >
                                    <td className="px-2 py-1.5">
                                        <select
                                            className={`${INPUT_CLASS} field-select w-full h-8`}
                                            value={line.productId}
                                            onChange={(e) =>
                                                pickProduct(
                                                    line.key,
                                                    e.target.value,
                                                )
                                            }
                                            aria-label="Product"
                                        >
                                            <option value="">
                                                {productsQuery.isLoading
                                                    ? 'Loading…'
                                                    : 'Select product'}
                                            </option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.barcode})
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            className={`${INPUT_CLASS} w-full h-8 text-right`}
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            value={line.quantity}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    quantity: e.target.value,
                                                })
                                            }
                                            aria-label="Quantity"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            className={`${INPUT_CLASS} w-full h-8 text-right`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.unitCost}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    unitCost: e.target.value,
                                                })
                                            }
                                            aria-label="Unit cost"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            className={`${INPUT_CLASS} w-full h-8`}
                                            value={line.batchNo}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    batchNo: e.target.value,
                                                })
                                            }
                                            maxLength={64}
                                            aria-label="Batch number"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            className={`${INPUT_CLASS} w-full h-8${(line.expiryDate) ? '' : ' date-empty'}`}
                                            type="date"
                                            value={line.expiryDate}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    expiryDate: e.target.value,
                                                })
                                            }
                                            aria-label="Expiry date"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 text-right text-[13px] tabular-nums text-text-1">
                                        {Number.isFinite(line.qtyNum) &&
                                        Number.isFinite(line.costNum) &&
                                        line.quantity !== '' &&
                                        line.unitCost !== ''
                                            ? formatCurrency(
                                                  line.qtyNum * line.costNum,
                                              )
                                            : '—'}
                                    </td>
                                    <td className="px-2 py-1.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeLine(line.key)
                                            }
                                            aria-label="Remove line"
                                            className="inline-flex items-center justify-center w-7 h-7 rounded text-text-3 hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-40"
                                            disabled={parsedLines.length === 1}
                                        >
                                            <Trash2 size={14} aria-hidden />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLines((prev) => [...prev, emptyLine()])}
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
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={1000}
                        />
                    </label>
                    <div className="space-y-2 sm:justify-self-end sm:min-w-[260px]">
                        <div className="flex items-center justify-between text-sm text-text-2">
                            <span>Subtotal</span>
                            <span className="tabular-nums">
                                {formatCurrency(subTotal)}
                            </span>
                        </div>
                        <label className="flex items-center justify-between gap-3 text-sm text-text-2">
                            <span>Discount</span>
                            <input
                                className={`${INPUT_CLASS} h-8 w-28 text-right`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                aria-label="Discount amount"
                            />
                        </label>
                        <div className="flex items-center justify-between pt-2 border-t border-border text-text-1 font-semibold">
                            <span>Grand total</span>
                            <span className="tabular-nums">
                                {formatCurrency(Math.max(grandTotal, 0))}
                            </span>
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={!canSubmit || createGrn.isPending}
                        >
                            {createGrn.isPending
                                ? 'Receiving…'
                                : `Receive & bill ${formatCurrency(Math.max(grandTotal, 0))}`}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}
