import { useMemo } from 'react';
import { Triangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type {
    IBranchComparisonEntry,
    IComparisonTopProduct,
} from '@/types';
import { formatCurrencyWhole } from '../lib/format';

interface TopProductsComparatorProps {
    branches: IBranchComparisonEntry[];
    limit?: number;
}

interface MatrixRow {
    productId: string;
    productName: string;
    totalRevenue: number;
    perBranch: Record<string, IComparisonTopProduct | undefined>;
    leaderBranchId: string | null;
}

function buildMatrix(
    branches: IBranchComparisonEntry[],
    limit: number,
): MatrixRow[] {
    const productMap = new Map<string, MatrixRow>();

    for (const branch of branches) {
        for (const product of branch.topProducts) {
            let row = productMap.get(product.productId);
            if (!row) {
                row = {
                    productId: product.productId,
                    productName: product.productName,
                    totalRevenue: 0,
                    perBranch: {},
                    leaderBranchId: null,
                };
                productMap.set(product.productId, row);
            }
            row.perBranch[branch.branchId] = product;
            row.totalRevenue += product.revenue;
        }
    }

    const rows = Array.from(productMap.values());
    for (const row of rows) {
        let bestRevenue = -Infinity;
        let bestBranchId: string | null = null;
        for (const branch of branches) {
            const cell = row.perBranch[branch.branchId];
            if (cell && cell.revenue > bestRevenue) {
                bestRevenue = cell.revenue;
                bestBranchId = branch.branchId;
            }
        }
        row.leaderBranchId = bestBranchId;
    }

    rows.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return rows.slice(0, limit);
}

export function TopProductsComparator({
    branches,
    limit = 10,
}: TopProductsComparatorProps) {
    const rows = useMemo(() => buildMatrix(branches, limit), [branches, limit]);

    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-semibold text-text-1 tracking-tight">
                        Top products by branch
                    </p>
                    <p className="text-[11px] text-text-3 mt-0.5">
                        Best-selling branch per product is highlighted.
                    </p>
                </div>
                <p className="text-[11px] text-text-3 tabular-nums">
                    {rows.length} {rows.length === 1 ? 'product' : 'products'}
                </p>
            </div>

            {rows.length === 0 ? (
                <EmptyState title="No sales in this range" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2">
                                <th className="sticky left-0 bg-surface-2 px-5 py-2.5 font-semibold min-w-[200px]">
                                    Product
                                </th>
                                {branches.map((b) => (
                                    <th
                                        key={b.branchId}
                                        className="px-4 py-2.5 font-semibold text-right whitespace-nowrap"
                                    >
                                        {b.branchName}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.productId}
                                    className="border-t border-border hover:bg-surface-2/40 transition-colors"
                                >
                                    <td className="sticky left-0 bg-surface px-5 py-3 text-[13px] text-text-1 font-medium">
                                        {row.productName}
                                    </td>
                                    {branches.map((b) => {
                                        const cell = row.perBranch[b.branchId];
                                        const isLeader =
                                            row.leaderBranchId === b.branchId;
                                        if (!cell) {
                                            return (
                                                <td
                                                    key={b.branchId}
                                                    className="px-4 py-3 text-right text-text-3 mono text-[12px]"
                                                >
                                                    —
                                                </td>
                                            );
                                        }
                                        return (
                                            <td
                                                key={b.branchId}
                                                className={`px-4 py-3 text-right ${
                                                    isLeader
                                                        ? 'bg-primary-soft/40'
                                                        : ''
                                                }`}
                                            >
                                                <p
                                                    className={`mono tabular-nums text-[13px] ${
                                                        isLeader
                                                            ? 'font-bold text-text-1'
                                                            : 'text-text-1'
                                                    }`}
                                                >
                                                    {isLeader && (
                                                        <Triangle
                                                            size={9}
                                                            fill="currentColor"
                                                            className="inline-block mr-1 -mt-0.5 text-primary"
                                                            aria-label="Top branch"
                                                        />
                                                    )}
                                                    {formatCurrencyWhole(
                                                        cell.revenue,
                                                    )}
                                                </p>
                                                <p className="text-[11px] text-text-3 mono tabular-nums mt-0.5">
                                                    {cell.quantity.toLocaleString()}{' '}
                                                    qty
                                                </p>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
