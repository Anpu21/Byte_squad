import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IReorderSupplierGroup } from '@/types';

interface IReorderSupplierCardProps {
    group: IReorderSupplierGroup;
    selected: boolean;
    onToggle: (supplierId: string) => void;
}

/** One supplier's reorder lines with a select-to-draft checkbox. */
export function ReorderSupplierCard({
    group,
    selected,
    onToggle,
}: IReorderSupplierCardProps) {
    return (
        <Card className="p-0 overflow-hidden">
            <label className="flex items-center gap-3 p-3 border-b border-border cursor-pointer">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(group.supplierId)}
                    className="h-4 w-4 accent-primary"
                    aria-label={`Include ${group.supplierName}`}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-text-1 truncate">
                        {group.supplierName}
                    </p>
                    <p className="text-[12px] text-text-3">
                        {group.lines.length} item
                        {group.lines.length === 1 ? '' : 's'}
                    </p>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-text-1">
                    {formatCurrency(group.totalValue)}
                </span>
            </label>
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead>
                        <tr className="text-text-3 text-left">
                            <th className="px-3 py-2 font-medium">Product</th>
                            <th className="px-3 py-2 font-medium text-right">
                                On hand
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                                On order
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                                /day
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                                Suggested
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                                Unit cost
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                                Line total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {group.lines.map((line) => (
                            <tr
                                key={line.productId}
                                className="border-t border-border/60"
                            >
                                <td className="px-3 py-2 text-text-1">
                                    {line.productName}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-text-2">
                                    {line.onHand} {line.baseUnit}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-text-2">
                                    {line.onOrder}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-text-2">
                                    {line.velocityPerDay}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-semibold text-text-1">
                                    {line.suggestedQty} {line.baseUnit}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-text-2">
                                    {formatCurrency(line.unitCost)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-text-1">
                                    {formatCurrency(
                                        line.suggestedQty * line.unitCost,
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
