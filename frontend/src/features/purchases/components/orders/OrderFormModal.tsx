import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuPlus as Plus, LuTrash2 as Trash2 } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { inventoryService } from '@/services/inventory.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useSuppliers } from '../../hooks/useSuppliers';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

interface IOrderLineDraft {
    key: number;
    productId: string;
    quantity: string;
    unitCost: string;
}

let orderLineKey = 0;
const emptyLine = (): IOrderLineDraft => ({
    key: ++orderLineKey,
    productId: '',
    quantity: '',
    unitCost: '',
});

interface IOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Raise a purchase order (intent only — Draft until sent/received). */
export function OrderFormModal({ isOpen, onClose }: IOrderFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New purchase order"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? <OrderForm onClose={onClose} /> : null}
        </Modal>
    );
}

function OrderForm({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const { create } = usePurchaseOrderMutations();

    const [supplierId, setSupplierId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<IOrderLineDraft[]>([emptyLine()]);

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

    function patchLine(key: number, patch: Partial<IOrderLineDraft>) {
        setLines((prev) =>
            prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
    }

    const parsed = lines.map((l) => ({
        ...l,
        qtyNum: Number(l.quantity),
        costNum: Number(l.unitCost),
    }));
    const complete = parsed.filter(
        (l) =>
            l.productId &&
            Number.isFinite(l.qtyNum) &&
            l.qtyNum > 0 &&
            Number.isFinite(l.costNum) &&
            l.costNum >= 0,
    );
    const totalValue = complete.reduce(
        (sum, l) => sum + l.qtyNum * l.costNum,
        0,
    );
    const canSubmit =
        supplierId.length > 0 &&
        (!isAdmin || branchId.length > 0) &&
        complete.length === parsed.length &&
        complete.length > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || create.isPending) return;
        try {
            const order = await create.mutateAsync({
                supplierId,
                branchId: isAdmin ? branchId : undefined,
                expectedDate: expectedDate || undefined,
                notes: notes.trim() || undefined,
                items: complete.map((l) => ({
                    productId: l.productId,
                    quantity: l.qtyNum,
                    unitCost: l.costNum,
                })),
            });
            toast.success(`${order.poNumber} created`);
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not create the order');
            } else {
                toast.error('Could not create the order');
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Supplier
                    </span>
                    <select
                        className={`${INPUT_CLASS} w-full`}
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
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
                            Branch
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select branch
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
                        Expected delivery
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                    />
                </label>
            </div>

            <div className="overflow-x-auto border border-border rounded-md">
                <table className="w-full text-left">
                    <thead className="bg-surface-2/60 border-b border-border">
                        <tr className="text-[11px] uppercase tracking-wide text-text-3">
                            <th className="px-2 py-2 font-medium min-w-[200px]">
                                Item
                            </th>
                            <th className="px-2 py-2 font-medium w-24">Qty</th>
                            <th className="px-2 py-2 font-medium w-28">
                                Unit cost
                            </th>
                            <th className="px-2 py-2 font-medium text-right w-28">
                                Amount
                            </th>
                            <th className="px-2 py-2 w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {parsed.map((line) => (
                            <tr
                                key={line.key}
                                className="border-b border-border last:border-b-0"
                            >
                                <td className="px-2 py-1.5">
                                    <select
                                        className={`${INPUT_CLASS} w-full h-8`}
                                        value={line.productId}
                                        onChange={(e) => {
                                            const product = productById.get(
                                                e.target.value,
                                            );
                                            patchLine(line.key, {
                                                productId: e.target.value,
                                                unitCost: product
                                                    ? String(
                                                          product.costPrice,
                                                      )
                                                    : line.unitCost,
                                            });
                                        }}
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
                                            setLines((prev) =>
                                                prev.length > 1
                                                    ? prev.filter(
                                                          (l) =>
                                                              l.key !==
                                                              line.key,
                                                      )
                                                    : prev,
                                            )
                                        }
                                        aria-label="Remove line"
                                        className="inline-flex items-center justify-center w-7 h-7 rounded text-text-3 hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-40"
                                        disabled={parsed.length === 1}
                                    >
                                        <Trash2 size={14} aria-hidden />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLines((prev) => [...prev, emptyLine()])}
                >
                    <Plus size={14} aria-hidden />
                    Add line
                </Button>
                <span className="text-sm text-text-2">
                    Order value:{' '}
                    <span className="font-semibold text-text-1 tabular-nums">
                        {formatCurrency(totalValue)}
                    </span>
                </span>
            </div>

            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Notes (optional)
                </span>
                <textarea
                    className="w-full min-h-[56px] px-3 py-2 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                />
            </label>

            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={create.isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={create.isPending || !canSubmit}
                >
                    {create.isPending ? 'Creating…' : 'Create order'}
                </Button>
            </div>
        </form>
    );
}
