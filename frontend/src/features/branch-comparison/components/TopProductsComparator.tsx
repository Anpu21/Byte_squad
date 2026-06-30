import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { IBranchAnalyticsComparisonEntry } from '@/types';
import { CHART_COLORS } from '../lib/chart-config';
import { buildProducts, flattenRows } from './top-products-data';
import { TopProductsTable } from './TopProductsTable';

interface TopProductsComparatorProps {
    branches: IBranchAnalyticsComparisonEntry[];
    limit?: number;
    branchColors?: Record<string, string>;
}

export function TopProductsComparator({
    branches,
    limit = 10,
    branchColors,
}: TopProductsComparatorProps) {
    const products = useMemo(
        () => buildProducts(branches, limit),
        [branches, limit],
    );

    // Stable colour per branch by index, overridable via branchColors map.
    const colorForBranch = useMemo(() => {
        const map = new Map<string, string>();
        branches.forEach((branch, i) => {
            map.set(
                branch.branchId,
                branchColors?.[branch.branchId] ??
                    CHART_COLORS[i % CHART_COLORS.length],
            );
        });
        return map;
    }, [branches, branchColors]);

    const rows = useMemo(
        () =>
            flattenRows(
                products,
                (branchId) => colorForBranch.get(branchId) ?? CHART_COLORS[0],
            ),
        [products, colorForBranch],
    );

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/40 px-5 py-3.5">
                <div>
                    <p className="text-[13px] font-semibold text-text-1 tracking-tight">
                        Top products by branch
                    </p>
                    <p className="text-[11px] text-text-3 mt-0.5">
                        Best-selling branch per product is highlighted.
                    </p>
                </div>
                {products.length > 0 && (
                    <p className="shrink-0 text-[11px] text-text-3 tabular-nums">
                        {products.length}{' '}
                        {products.length === 1 ? 'product' : 'products'}
                    </p>
                )}
            </div>

            {products.length === 0 ? (
                <EmptyState title="No sales in this range" />
            ) : (
                <TopProductsTable rows={rows} />
            )}
        </Card>
    );
}
