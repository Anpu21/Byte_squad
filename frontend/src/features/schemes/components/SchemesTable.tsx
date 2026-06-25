import toast from 'react-hot-toast';
import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import { useConfirm } from '@/hooks/useConfirm';
import type { IDiscountScheme } from '@/types';
import { useSchemeMutations } from '../hooks/useSchemeMutations';

interface ISchemesTableProps {
    rows: IDiscountScheme[];
    isLoading: boolean;
    /** product id → display name, for Product-scoped rows. */
    productNameById: Map<string, string>;
    /** branch id → display name; null branchId renders "All branches". */
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
            title: `Delete "${scheme.name}"?`,
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

    const columns: DataTableColumn<IDiscountScheme>[] = [
        {
            key: 'name',
            header: 'Scheme',
            className: 'font-medium',
            render: (s) => s.name,
        },
        {
            key: 'appliesTo',
            header: 'Applies to',
            className: 'text-text-2',
            render: (s) =>
                s.scope === 'Product'
                    ? (productNameById.get(s.productId ?? '') ?? 'Product')
                    : `Category · ${s.category ?? '—'}`,
        },
        {
            key: 'branch',
            header: 'Branch',
            className: 'text-text-2',
            render: (s) =>
                s.branchId === null
                    ? 'All branches'
                    : (branchNameById.get(s.branchId) ?? '—'),
        },
        {
            key: 'minQty',
            header: 'Min qty',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (s) => (Number(s.minQty) > 0 ? Number(s.minQty) : '—'),
        },
        {
            key: 'discount',
            header: 'Discount',
            align: 'right',
            numeric: true,
            render: (s) => `${Number(s.discountPercentage)}%`,
        },
        {
            key: 'window',
            header: 'Window',
            className: 'text-text-2 tabular-nums',
            render: (s) => `${s.startDate} → ${s.endDate}`,
        },
        {
            key: 'status',
            header: 'Status',
            render: (s) => (
                <Pill tone={s.isActive ? 'success' : 'neutral'}>
                    {s.isActive ? 'Active' : 'Paused'}
                </Pill>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (s) => (
                <div className="inline-flex gap-1.5 whitespace-nowrap">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
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
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(s) => s.id}
            isLoading={isLoading}
            zebra
            empty={
                <EmptyState
                    title="No discount schemes yet"
                    description="Create a rule to auto-apply a discount at the POS for a product or category during a date window."
                />
            }
        />
    );
}
