import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

interface TopProductsTableProps {
    topProducts: IMyBranchPerformance['topProducts'];
}

export function TopProductsTable({ topProducts }: TopProductsTableProps) {
    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Top products
                </h3>
                <p className="text-xs text-text-2 mt-0.5">Last 30 days</p>
            </div>
            {topProducts.length === 0 ? (
                <EmptyState title="No sales data yet" />
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                            <th className="px-5 py-2.5 font-semibold">Product</th>
                            <th className="px-5 py-2.5 font-semibold text-right">
                                Qty
                            </th>
                            <th className="px-5 py-2.5 font-semibold text-right">
                                Revenue
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {topProducts.map((p) => (
                            <tr
                                key={p.productId}
                                className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                            >
                                <td className="px-5 py-3 text-[13px] text-text-1 font-medium">
                                    {p.name}
                                </td>
                                <td className="px-5 py-3 mono text-[13px] text-text-2 text-right">
                                    {p.quantity}
                                </td>
                                <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                    {formatCurrencyWhole(p.revenue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Card>
    );
}
