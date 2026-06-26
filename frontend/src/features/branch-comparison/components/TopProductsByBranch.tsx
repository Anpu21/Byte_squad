import { LuStar as Star } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { IBranchAnalyticsComparisonEntry } from '@/types';
import { CHART_COLORS } from '../lib/chart-config';
import { formatCurrencyWhole } from '../lib/format';

interface TopProductsByBranchProps {
    entry: IBranchAnalyticsComparisonEntry;
    branchColors?: Record<string, string>;
}

export function TopProductsByBranch({
    entry,
    branchColors,
}: TopProductsByBranchProps) {
    const products = entry.sales.topProducts;
    const maxRevenue = products.reduce(
        (max, p) => (p.revenue > max ? p.revenue : max),
        0,
    );
    const color = branchColors?.[entry.branchId] ?? CHART_COLORS[0];
    const leaderProductId = products.reduce<string | null>(
        (leader, p) =>
            leader === null ||
            p.revenue >
                (products.find((q) => q.productId === leader)?.revenue ?? 0)
                ? p.productId
                : leader,
        null,
    );

    return (
        <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
                <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                />
                <p className="text-[13px] font-semibold text-text-1">
                    Top products — {entry.branchName}
                </p>
            </div>

            {products.length === 0 ? (
                <EmptyState title="No sales in this range" />
            ) : (
                <ul className="space-y-2.5">
                    {products.map((product) => {
                        const isLeader =
                            product.productId === leaderProductId;
                        const pct =
                            maxRevenue > 0
                                ? (product.revenue / maxRevenue) * 100
                                : 0;
                        return (
                            <li
                                key={product.productId}
                                className="flex items-center gap-3"
                            >
                                <span className="flex min-w-0 items-center gap-1.5 basis-[40%] shrink-0">
                                    {isLeader && (
                                        <span className="inline-flex shrink-0 items-center rounded-full bg-accent-soft p-0.5 text-accent-text">
                                            <Star
                                                size={9}
                                                fill="currentColor"
                                                aria-label="Top product"
                                            />
                                        </span>
                                    )}
                                    <span
                                        className={`truncate text-[12px] ${
                                            isLeader
                                                ? 'font-semibold text-text-1'
                                                : 'text-text-2'
                                        }`}
                                    >
                                        {product.productName}
                                    </span>
                                </span>

                                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                                    <span
                                        className="block h-full rounded-full transition-[width]"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: color,
                                        }}
                                    />
                                </span>

                                <span className="shrink-0 text-right">
                                    <span className="block mono tabular-nums text-[12px] text-text-1">
                                        {formatCurrencyWhole(product.revenue)}
                                    </span>
                                    <span className="block mono tabular-nums text-[10px] text-text-3">
                                        {product.quantity.toLocaleString()} qty
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}
