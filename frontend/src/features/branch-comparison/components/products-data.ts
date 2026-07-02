import { CHART_COLORS } from "@/components/charts/chart-palette";
import type { DonutSlice } from "@/components/charts/DonutChart";
import type {
  BranchAnalyticsProductMetric,
  IBranchAnalyticsProductPerBranch,
  IBranchAnalyticsProductRow,
} from "@/types";
import type { ChartRow } from "./charts/ChartTooltip";

export interface ProductBranchInfo {
  branchId: string;
  branchName: string;
}

/** Past this many products a per-branch mix donut rolls the tail into "Other". */
const MAX_MIX_SLICES = 8;

export function metricOf(
  cell: Pick<IBranchAnalyticsProductPerBranch, "revenue" | "quantity">,
  metric: BranchAnalyticsProductMetric,
): number {
  return metric === "quantity" ? cell.quantity : cell.revenue;
}

export function totalOf(
  row: IBranchAnalyticsProductRow,
  metric: BranchAnalyticsProductMetric,
): number {
  return metric === "quantity" ? row.totalQuantity : row.totalRevenue;
}

function cellFor(
  row: IBranchAnalyticsProductRow,
  branchId: string,
): IBranchAnalyticsProductPerBranch | undefined {
  return row.perBranch.find((c) => c.branchId === branchId);
}

// productId → stable palette colour (mod-6 wrap). The SAME product keeps one
// colour across every branch's mix pie — the crux of reading "bananas here vs
// bananas there" at a glance.
export function buildProductColors(
  items: IBranchAnalyticsProductRow[],
): Record<string, string> {
  const map: Record<string, string> = {};
  items.forEach((row, idx) => {
    map[row.productId] = CHART_COLORS[idx % CHART_COLORS.length];
  });
  return map;
}

// (a) Per-branch product-mix donut — for ONE branch, each product is a slice
// (coloured by product). Zero-value products are dropped; the tail past
// MAX_MIX_SLICES rolls into a muted "Other" slice.
export function buildProductMixByBranch(
  items: IBranchAnalyticsProductRow[],
  branch: ProductBranchInfo,
  metric: BranchAnalyticsProductMetric,
  colorFor: (productId: string) => string,
): DonutSlice[] {
  const valued = items
    .map((row) => ({
      productId: row.productId,
      name: row.productName,
      value: (() => {
        const cell = cellFor(row, branch.branchId);
        return cell ? metricOf(cell, metric) : 0;
      })(),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const slices: DonutSlice[] = valued.slice(0, MAX_MIX_SLICES).map((s) => ({
    name: s.name,
    value: s.value,
    color: colorFor(s.productId),
  }));

  const rest = valued.slice(MAX_MIX_SLICES);
  if (rest.length > 0) {
    slices.push({
      name: `Other (${rest.length})`,
      value: rest.reduce((sum, s) => sum + s.value, 0),
      color: "var(--text-3)",
    });
  }
  return slices;
}

export interface GroupedBarChart {
  data: ChartRow[];
  bars: { key: string; label: string; color: string }[];
}

// (b) Grouped bars — one group per product, one bar per branch (branch-coloured
// so the same branch reads consistently against the mix pies and drill-down).
export function buildGroupedBarChart(
  items: IBranchAnalyticsProductRow[],
  branches: ProductBranchInfo[],
  metric: BranchAnalyticsProductMetric,
  branchColorFor: (branchId: string) => string,
): GroupedBarChart {
  const data: ChartRow[] = items.map((row) => {
    const entry: ChartRow = { name: row.productName };
    for (const branch of branches) {
      const cell = cellFor(row, branch.branchId);
      entry[branch.branchId] = cell ? metricOf(cell, metric) : 0;
    }
    return entry;
  });
  const bars = branches.map((branch) => ({
    key: branch.branchId,
    label: branch.branchName,
    color: branchColorFor(branch.branchId),
  }));
  return { data, bars };
}

// (c) Single-product drill-down donut — ONE product split across branches
// (coloured by branch). Zero-value branches are dropped from the ring.
export function buildSingleProductSlices(
  row: IBranchAnalyticsProductRow,
  branches: ProductBranchInfo[],
  metric: BranchAnalyticsProductMetric,
  branchColorFor: (branchId: string) => string,
): DonutSlice[] {
  return branches
    .map((branch) => {
      const cell = cellFor(row, branch.branchId);
      return {
        name: branch.branchName,
        value: cell ? metricOf(cell, metric) : 0,
        color: branchColorFor(branch.branchId),
      };
    })
    .filter((s) => s.value > 0);
}

export interface ProductTableCell {
  branchId: string;
  value: number;
  isLeader: boolean;
}

// (d) Accurate product × branch table row + the leader branch and the lead gap
// over the runner-up (fraction of the leader, 0..1) for the active metric.
export interface ProductTableRow {
  productId: string;
  productName: string;
  total: number;
  perBranch: ProductTableCell[];
  leaderBranchId: string | null;
  leadGap: number;
}

export function buildProductTableRows(
  items: IBranchAnalyticsProductRow[],
  branches: ProductBranchInfo[],
  metric: BranchAnalyticsProductMetric,
): ProductTableRow[] {
  return items.map((row) => {
    const values = branches.map((branch) => {
      const cell = cellFor(row, branch.branchId);
      return { branchId: branch.branchId, value: cell ? metricOf(cell, metric) : 0 };
    });
    const ranked = [...values].sort((a, b) => b.value - a.value);
    const leader = ranked[0];
    const runnerUp = ranked[1];
    const leaderBranchId = leader && leader.value > 0 ? leader.branchId : null;
    const leadGap =
      leader && leader.value > 0 && runnerUp
        ? (leader.value - runnerUp.value) / leader.value
        : 0;
    return {
      productId: row.productId,
      productName: row.productName,
      total: totalOf(row, metric),
      perBranch: values.map((v) => ({
        ...v,
        isLeader: v.branchId === leaderBranchId,
      })),
      leaderBranchId,
      leadGap,
    };
  });
}
