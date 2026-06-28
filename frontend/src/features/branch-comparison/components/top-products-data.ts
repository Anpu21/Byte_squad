import type { IBranchAnalyticsComparisonEntry } from '@/types';

/** A product's sales at one branch. */
export interface ProductBranchCell {
    branchId: string;
    branchName: string;
    revenue: number;
    quantity: number;
}

/** A product across every compared branch, with its best-selling branch. */
export interface ProductCardData {
    productId: string;
    productName: string;
    totalRevenue: number;
    maxRevenue: number;
    leaderBranchId: string | null;
    cells: ProductBranchCell[];
}

/** One product at one branch — a flat row in the comparison table. */
export interface ProductBranchRow {
    productId: string;
    productName: string;
    branchId: string;
    branchName: string;
    revenue: number;
    quantity: number;
    /** This branch is the best-selling one for the product. */
    isLeader: boolean;
    /** Branch identity colour, shared across the comparison page. */
    color: string;
}

/**
 * Collapse each branch's top-products lists into a product × branch matrix,
 * tagging each product's best-selling (leader) branch. Returns the top `limit`
 * products by total revenue.
 */
export function buildProducts(
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

/**
 * Flatten the product × branch matrix into table rows: one row per
 * product-branch. Products keep their total-revenue order; within a product the
 * branches are ordered by revenue desc, so the leader sits first in its block.
 */
export function flattenRows(
    products: ProductCardData[],
    colorFor: (branchId: string) => string,
): ProductBranchRow[] {
    const rows: ProductBranchRow[] = [];
    for (const product of products) {
        const cells = [...product.cells].sort((a, b) => b.revenue - a.revenue);
        for (const cell of cells) {
            rows.push({
                productId: product.productId,
                productName: product.productName,
                branchId: cell.branchId,
                branchName: cell.branchName,
                revenue: cell.revenue,
                quantity: cell.quantity,
                isLeader: product.leaderBranchId === cell.branchId,
                color: colorFor(cell.branchId),
            });
        }
    }
    return rows;
}
