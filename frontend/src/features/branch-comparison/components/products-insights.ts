import type { ProductBranchInfo, ProductTableRow } from "./products-data";

export type InsightAccent = "primary" | "accent" | "info" | "warning";

export interface ProductInsight {
  key: string;
  label: string;
  value: string;
  note: string;
  accent: InsightAccent;
}

/**
 * "Key points & differences" for the current page of products, computed off the
 * already-shaped table rows for the active metric. Page-scoped by design — the
 * notes say "on this page" so a reader never mistakes it for a global claim.
 */
export function buildProductInsights(
  rows: ProductTableRow[],
  branches: ProductBranchInfo[],
  format: (n: number) => string,
): ProductInsight[] {
  if (rows.length === 0 || branches.length === 0) return [];
  const nameById = new Map(branches.map((b) => [b.branchId, b.branchName]));

  // 1 — the product with the widest leader-vs-lowest gap across branches.
  let widest: { name: string; gap: number; leader: string } | null = null;
  for (const row of rows) {
    const vals = row.perBranch.map((c) => c.value);
    const gap = Math.max(...vals) - Math.min(...vals);
    if (!widest || gap > widest.gap) {
      widest = {
        name: row.productName,
        gap,
        leader: nameById.get(row.leaderBranchId ?? "") ?? "—",
      };
    }
  }

  // 2 — which branch leads the most products on this page.
  const wins = new Map<string, number>();
  for (const row of rows) {
    if (row.leaderBranchId) {
      wins.set(row.leaderBranchId, (wins.get(row.leaderBranchId) ?? 0) + 1);
    }
  }
  const topWinner = [...wins.entries()].sort((a, b) => b[1] - a[1])[0];

  // 3 — products sold in some branches but absent (a real 0) in others.
  const uneven = rows.filter(
    (row) =>
      row.perBranch.some((c) => c.value === 0) &&
      row.perBranch.some((c) => c.value > 0),
  );

  const insights: ProductInsight[] = [];
  if (widest) {
    insights.push({
      key: "gap",
      label: "Widest branch gap",
      value: widest.name,
      note: `${widest.leader} leads by ${format(widest.gap)} on this page`,
      accent: "warning",
    });
  }
  if (topWinner) {
    insights.push({
      key: "wins",
      label: "Most product wins",
      value: nameById.get(topWinner[0]) ?? "—",
      note: `Leads ${topWinner[1]} of ${rows.length} products on this page`,
      accent: "accent",
    });
  }
  insights.push({
    key: "uneven",
    label: "Uneven coverage",
    value: `${uneven.length} ${uneven.length === 1 ? "product" : "products"}`,
    note:
      uneven.length > 0
        ? "Sold in some branches, absent in others"
        : "Every product sells in every branch here",
    accent: uneven.length > 0 ? "info" : "primary",
  });
  return insights;
}
