import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { ISupplier } from '@/types';

interface ISuppliersTableProps {
    rows: ISupplier[];
    isLoading: boolean;
    onEdit: (supplier: ISupplier) => void;
}

/** Supplier master list — read view with an Edit action per row. */
export function SuppliersTable({
    rows,
    isLoading,
    onEdit,
}: ISuppliersTableProps) {
    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                title="No suppliers yet"
                description="Add your first supplier to start receiving goods against them."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-3 py-2.5 font-medium">Supplier</th>
                        <th className="px-3 py-2.5 font-medium">Contact</th>
                        <th className="px-3 py-2.5 font-medium">Phone</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Terms
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Opening balance
                        </th>
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
                                {s.contactName ?? '—'}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2">
                                {s.phone ?? '—'}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                {s.creditTermDays}d
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-1 text-right tabular-nums">
                                {formatCurrency(Number(s.openingBalance))}
                            </td>
                            <td className="px-3 py-2.5">
                                <Pill
                                    tone={
                                        s.status === 'Active'
                                            ? 'success'
                                            : 'neutral'
                                    }
                                >
                                    {s.status}
                                </Pill>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onEdit(s)}
                                >
                                    Edit
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
