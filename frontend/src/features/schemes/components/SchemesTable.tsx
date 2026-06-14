import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import EmptyState from '@/components/ui/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import type { IDiscountScheme } from '@/types';
import { useSchemeMutations } from '../hooks/useSchemeMutations';

interface ISchemesTableProps {
    rows: IDiscountScheme[];
    isLoading: boolean;
    /** product id → display name, for Product-scoped rows. */
    productNameById: Map<string, string>;
    /** branch id → display name; null branchId renders “All branches”. */
    branchNameById: Map<string, string>;
    onEdit: (scheme: IDiscountScheme) => void;
}

/** Discount-scheme list — name, target, slab, window, status, actions. */
export function SchemesTable({
    rows,
    isLoading,
    productNameById,
    branchNameById,
    onEdit,
}: ISchemesTableProps) {
    const confirm = useConfirm();
    const { remove } = useSchemeMutations();

    async function handleDelete(scheme: IDiscountScheme) {
        const ok = await confirm({
            title: `Delete “${scheme.name}”?`,
            body: 'The rule stops applying immediately. Lines already rung up keep their discount.',
            confirmLabel: 'Delete scheme',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await remove.mutateAsync(scheme.id);
            toast.success('Scheme deleted');
        } catch {
            toast.error('Could not delete the scheme');
        }
    }

    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                title="No discount schemes yet"
                description="Create a rule to auto-apply a discount at the POS for a product or category during a date window."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-3 py-2.5 font-medium">Scheme</th>
                        <th className="px-3 py-2.5 font-medium">Applies to</th>
                        <th className="px-3 py-2.5 font-medium">Branch</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Min qty
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Discount
                        </th>
                        <th className="px-3 py-2.5 font-medium">Window</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((s) => (
                        <tr
                            key={s.id}
                            className="border-b border-border hover:bg-surface-2/40 transition-colors"
                        >
                            <td className="px-3 py-2.5 text-[13px] font-medium text-text-1">
                                {s.name}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2">
                                {s.scope === 'Product'
                                    ? (productNameById.get(
                                          s.productId ?? '',
                                      ) ?? 'Product')
                                    : `Category · ${s.category ?? '—'}`}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2">
                                {s.branchId === null
                                    ? 'All branches'
                                    : (branchNameById.get(s.branchId) ?? '—')}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                {Number(s.minQty) > 0
                                    ? Number(s.minQty)
                                    : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-1 text-right tabular-nums">
                                {Number(s.discountPercentage)}%
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 tabular-nums">
                                {s.startDate} → {s.endDate}
                            </td>
                            <td className="px-3 py-2.5">
                                <Pill tone={s.isActive ? 'success' : 'neutral'}>
                                    {s.isActive ? 'Active' : 'Paused'}
                                </Pill>
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                <div className="inline-flex gap-1.5">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => onEdit(s)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => void handleDelete(s)}
                                        disabled={remove.isPending}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
