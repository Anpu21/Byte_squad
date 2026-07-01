import { CHART_COLORS } from "@/components/charts/chart-palette";
import type {
  IBranchAnalyticsBranchOption,
  IBranchAnalyticsComparisonEntry,
  IBranchAnalyticsComparisonResponse,
  IBranchAnalyticsTrend,
} from "@/types";
import {
  formatCurrencyWhole,
  formatNumber,
  type MetricKey,
} from "../lib/format";
import type { LeaderboardRow } from "./useBranchComparisonPage.lib";

function metricValue(
  entry: IBranchAnalyticsComparisonEntry,
  metric: MetricKey,
): number {
  switch (metric) {
    case "revenue":
      return entry.financial.revenue;
    case "grossProfit":
      return entry.financial.grossProfit;
    case "transactions":
      return entry.sales.transactionCount;
    case "aov":
      return entry.sales.avgTransactionValue;
    case "activeProducts":
      return entry.inventory.activeProducts;
    case "loyaltyMembers":
      return entry.loyalty.activeMembers;
  }
}

function formatMetric(value: number, metric: MetricKey): string {
  if (
    metric === "transactions" ||
    metric === "activeProducts" ||
    metric === "loyaltyMembers"
  ) {
    return formatNumber(value);
  }
  return formatCurrencyWhole(value);
}

export interface ComparisonChartRow {
  name: string;
  Revenue: number;
  Expenses: number;
  Profit: number;
}

export function buildChartData(
  comparison: IBranchAnalyticsComparisonResponse | undefined,
): ComparisonChartRow[] {
  if (!comparison) return [];
  return comparison.branches.map((branch) => ({
    name: branch.branchName,
    Revenue: branch.financial.revenue,
    Expenses: branch.financial.expenses,
    Profit: branch.financial.grossProfit,
  }));
}

export function buildLeaderboard(
  comparison: IBranchAnalyticsComparisonResponse | undefined,
  metric: MetricKey,
): LeaderboardRow[] {
  if (!comparison) return [];
  const sorted = [...comparison.branches].sort(
    (a, b) => metricValue(b, metric) - metricValue(a, metric),
  );
  const leaderValue = sorted[0] ? metricValue(sorted[0], metric) : 0;
  return sorted.map((entry, idx) => {
    const value = metricValue(entry, metric);
    return {
      entry,
      rank: idx + 1,
      value,
      formattedValue: formatMetric(value, metric),
      shareOfLeader: leaderValue > 0 ? value / leaderValue : 0,
      deltaPct: leaderValue > 0 ? value / leaderValue - 1 : 0,
      isLeader: idx === 0,
      margin: entry.financial.grossProfit,
    };
  });
}

export interface ComparisonTotals {
  revenue: number;
  expenses: number;
  transactions: number;
}

export function buildTotals(
  comparison: IBranchAnalyticsComparisonResponse | undefined,
): ComparisonTotals {
  if (!comparison) {
    return { revenue: 0, expenses: 0, transactions: 0 };
  }
  return {
    revenue: comparison.totals.financial.revenue,
    expenses: comparison.totals.financial.expenses,
    transactions: comparison.totals.sales.transactionCount,
  };
}

// branchId → palette colour, shared by the daily-trend lines, filter chips,
// ranking, scatter and top-products so a branch reads the same colour
// everywhere. Keyed off the returned entry order (matches `trend.branches`).
export function buildBranchColors(
  branches: IBranchAnalyticsComparisonEntry[] | undefined,
): Record<string, string> {
  const map: Record<string, string> = {};
  (branches ?? []).forEach((branch, idx) => {
    map[branch.branchId] = CHART_COLORS[idx % CHART_COLORS.length];
  });
  return map;
}

// Combined daily revenue across branches — the Revenue KPI sparkline. The
// only KPI with a real daily series; the rest show value + tag + note only.
export function buildRevenueSpark(
  trend: IBranchAnalyticsTrend | undefined,
): number[] {
  return (trend?.days ?? []).map((day) =>
    Object.values(day.byBranch).reduce((sum, value) => sum + value, 0),
  );
}

export function getSelectedBranchNames(
  selectedIds: readonly string[],
  branches: readonly IBranchAnalyticsBranchOption[],
): string[] {
  return selectedIds
    .map((id) => branches.find((branch) => branch.id === id)?.name)
    .filter(Boolean) as string[];
}
