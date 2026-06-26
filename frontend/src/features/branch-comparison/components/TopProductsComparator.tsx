import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { IBranchAnalyticsComparisonEntry } from '@/types';
import { CHART_COLORS } from '../lib/chart-config';
import {
    ProductComparisonCard,
    type ProductBranchCell,
    type ProductCardData,
} from './ProductComparisonCard';

interface TopProductsComparatorProps {
    branches: IBranchAnalyticsComparisonEntry[];
    limit?: number;
    branchColors?: Record<string, string>;
}

function buildProducts(
    branches: IBranchAnalyticsComparisonEntry[],
    limit: number,
): ProductCardData[] {
    const productMap = new Map<
        string,
        {
            productName: string;
            totalRevenue: number;
            perBranch: Map<string, { revenue: number; quantity: number }>;
        }
    >();

    for (const branch of branches) {
        for (const product of branch.sales.topProducts) {
            let entry = productMap.get(product.productId);
            if (!entry) {
                entry = {
                    productName: product.productName,
                    totalRevenue: 0,
                    perBranch: new Map(),
                };
                productMap.set(product.productId, entry);
            }
            entry.perBranch.set(branch.branchId, {
                revenue: product.revenue,
                quantity: product.quantity,
            });
            entry.totalRevenue += product.revenue;
        }
    }

    const products: ProductCardData[] = [];
    for (const [productId, entry] of productMap) {
        let maxRevenue = 0;
        let leaderBranchId: string | null = null;

        // Union every branch so missing entries render as a zeroed row.
        const cells: ProductBranchCell[] = branches.map((branch) => {
            const cell = entry.perBranch.get(branch.branchId);
            const revenue = cell?.revenue ?? 0;
            const quantity = cell?.quantity ?? 0;
            if (revenue > maxRevenue) {
                maxRevenue = revenue;
                leaderBranchId = branch.branchId;
            }
            return {
                branchId: branch.branchId,
                branchName: branch.branchName,
                revenue,
                quantity,
            };
        });

        products.push({
            productId,
            productName: entry.productName,
            totalRevenue: entry.totalRevenue,
            maxRevenue,
            leaderBranchId,
            cells,
        });
    }

    products.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return products.slice(0, limit);
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

    if (products.length === 0) {
        return (
            <Card className="overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-surface-2/40">
                    <p className="text-[13px] font-semibold text-text-1 tracking-tight">
                        Top products by branch
                    </p>
                    <p className="text-[11px] text-text-3 mt-0.5">
                        Best-selling branch per product is highlighted.
                    </p>
                </div>
                <EmptyState title="No sales in this range" />
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[13px] font-semibold text-text-1 tracking-tight">
                        Top products by branch
                    </p>
                    <p className="text-[11px] text-text-3 mt-0.5">
                        Best-selling branch per product is highlighted.
                    </p>
                </div>
                <p className="text-[11px] text-text-3 tabular-nums">
                    {products.length}{' '}
                    {products.length === 1 ? 'product' : 'products'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                    <ProductComparisonCard
                        key={product.productId}
                        product={product}
                        colorFor={(branchId) =>
                            colorForBranch.get(branchId) ?? CHART_COLORS[0]
                        }
                    />
                ))}
            </div>
        </div>
    );
}
