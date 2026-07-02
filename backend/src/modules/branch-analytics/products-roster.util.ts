import type {
  BranchAnalyticsProductPerBranch,
  BranchAnalyticsProductRow,
} from './types';

export interface ProductRosterEntry {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
}

export interface ProductBranchBreakdown {
  productId: string;
  branchId: string;
  revenue: number;
  quantity: number;
}

/**
 * Combine the ranked product roster (one page) with the per-(product, branch)
 * breakdown into accurate product rows. Every selected branch is always present
 * in `perBranch`, in `branchIds` order; a branch with no sales of a product
 * gets a genuine zero rather than being dropped. That zero-fill is the whole
 * point of the accurate comparison (the old top-5-per-branch view silently
 * omitted branches, making them read as ₨0 when they actually had sales).
 *
 * Pure + DB-free so accuracy can be unit-tested without a database.
 */
export function assembleProductRows(
  roster: ProductRosterEntry[],
  breakdown: ProductBranchBreakdown[],
  branchIds: string[],
): BranchAnalyticsProductRow[] {
  const byKey = new Map<string, ProductBranchBreakdown>();
  for (const row of breakdown) {
    byKey.set(`${row.productId}:${row.branchId}`, row);
  }

  return roster.map((product) => {
    const perBranch: BranchAnalyticsProductPerBranch[] = branchIds.map(
      (branchId) => {
        const cell = byKey.get(`${product.productId}:${branchId}`);
        return {
          branchId,
          revenue: cell ? cell.revenue : 0,
          quantity: cell ? cell.quantity : 0,
        };
      },
    );
    return {
      productId: product.productId,
      productName: product.productName,
      totalRevenue: product.totalRevenue,
      totalQuantity: product.totalQuantity,
      perBranch,
    };
  });
}
