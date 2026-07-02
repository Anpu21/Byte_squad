import type {
  BrandBranchCell,
  BrandBranchProductRow,
  BrandBranchRow,
} from '@/modules/brands/types';

export interface BrandRosterEntry {
  brandId: string | null;
  brandName: string;
  color: string | null;
  units: number;
  revenue: number;
  profit: number;
  transactions: number;
}

export interface BrandBranchBreakdownEntry {
  brandId: string | null;
  branchId: string;
  units: number;
  revenue: number;
  profit: number;
}

export interface BrandProductRosterEntry {
  productId: string;
  productName: string;
  units: number;
  revenue: number;
  profit: number;
}

export interface BrandProductBreakdownEntry {
  productId: string;
  branchId: string;
  units: number;
  revenue: number;
  profit: number;
}

/** Unbranded rows aggregate under brandId null — key them apart from brands. */
const brandKey = (brandId: string | null): string => brandId ?? 'unbranded';

function zeroFilledCells(
  lookup: (
    branchId: string,
  ) => { units: number; revenue: number; profit: number } | undefined,
  branchIds: string[],
): BrandBranchCell[] {
  return branchIds.map((branchId) => {
    const cell = lookup(branchId);
    return {
      branchId,
      revenue: cell?.revenue ?? 0,
      units: cell?.units ?? 0,
      profit: cell?.profit ?? 0,
    };
  });
}

/**
 * Combine the ranked brand roster with the per-(brand, branch) breakdown into
 * brand×branch rows. Every selected branch is present in each row's
 * `perBranch`, in `branchIds` order; a branch with no sales of a brand gets a
 * genuine zero cell rather than being dropped. `marginPct`/`sharePct` are 0
 * placeholders — the service computes them against the selection totals.
 *
 * Pure + DB-free so the zero-fill accuracy can be unit-tested without a
 * database (mirrors `assembleProductRows` in branch-analytics).
 */
export function assembleBrandBranchRows(
  roster: BrandRosterEntry[],
  breakdown: BrandBranchBreakdownEntry[],
  branchIds: string[],
): BrandBranchRow[] {
  const byKey = new Map<string, BrandBranchBreakdownEntry>();
  for (const entry of breakdown) {
    byKey.set(`${brandKey(entry.brandId)}:${entry.branchId}`, entry);
  }

  return roster.map((brand) => ({
    brandId: brand.brandId,
    brandName: brand.brandName,
    color: brand.color,
    units: brand.units,
    revenue: brand.revenue,
    profit: brand.profit,
    transactions: brand.transactions,
    marginPct: 0,
    sharePct: 0,
    perBranch: zeroFilledCells(
      (branchId) => byKey.get(`${brandKey(brand.brandId)}:${branchId}`),
      branchIds,
    ),
  }));
}

/**
 * Same assembly for one brand's paginated product roster: one row per product
 * on the page, every selected branch zero-filled in `branchIds` order.
 */
export function assembleBrandBranchProductRows(
  roster: BrandProductRosterEntry[],
  breakdown: BrandProductBreakdownEntry[],
  branchIds: string[],
): BrandBranchProductRow[] {
  const byKey = new Map<string, BrandProductBreakdownEntry>();
  for (const entry of breakdown) {
    byKey.set(`${entry.productId}:${entry.branchId}`, entry);
  }

  return roster.map((product) => ({
    productId: product.productId,
    productName: product.productName,
    units: product.units,
    revenue: product.revenue,
    profit: product.profit,
    marginPct: 0,
    sharePct: 0,
    perBranch: zeroFilledCells(
      (branchId) => byKey.get(`${product.productId}:${branchId}`),
      branchIds,
    ),
  }));
}
