import { BRANCH_ANALYTICS_SECTIONS } from "@/types";
import type {
  IBranchAnalyticsComparisonEntry,
  IBranchAnalyticsComparisonRequest,
} from "@/types";
import {
  COMPARISON_VIEWS,
  type ComparisonView,
  type MetricKey,
} from "../lib/format";
import {
  PRESET_ORDER,
  type PresetKey,
} from "../lib/preset-ranges";

export interface LeaderboardRow {
  entry: IBranchAnalyticsComparisonEntry;
  rank: number;
  value: number;
  formattedValue: string;
  shareOfLeader: number;
  deltaPct: number;
  isLeader: boolean;
  margin: number;
}

export const AUTO_REFRESH_DELAY_MS = 450;
export const DEFAULT_PRESET: PresetKey = "7d";
export const DEFAULT_METRIC: MetricKey = "revenue";
export const DEFAULT_VIEW: ComparisonView = "summary";
const VALID_METRICS: MetricKey[] = [
  "revenue",
  "grossProfit",
  "transactions",
  "aov",
  "activeProducts",
  "loyaltyMembers",
];

export function isPresetKey(value: string | null): value is PresetKey {
  return value !== null && (PRESET_ORDER as string[]).includes(value);
}

export function isMetricKey(value: string | null): value is MetricKey {
  return value !== null && (VALID_METRICS as string[]).includes(value);
}

export function isComparisonView(value: string | null): value is ComparisonView {
  return value !== null && (COMPARISON_VIEWS as string[]).includes(value);
}

export function isInputDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseBranchIds(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function unique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

// Request the opt-in `trend` section (the Summary daily-revenue chart + the
// Revenue KPI sparkline) alongside the default metric sections. Kept
// view-independent so switching sub-tabs reuses the cached response instead of
// refetching; `trend` is cheap and Summary is the default view.
const COMPARISON_SECTIONS = [...BRANCH_ANALYTICS_SECTIONS, "trend" as const];

export function toRequest(
  ids: readonly string[],
  start: string,
  end: string,
): IBranchAnalyticsComparisonRequest {
  return {
    branchIds: [...ids],
    startDate: new Date(start).toISOString(),
    endDate: new Date(`${end}T23:59:59.999`).toISOString(),
    sections: COMPARISON_SECTIONS,
  };
}

export function sameRequest(
  a: IBranchAnalyticsComparisonRequest | null,
  b: IBranchAnalyticsComparisonRequest | null,
): boolean {
  if (!a || !b) return a === b;
  return (
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    a.branchIds?.length === b.branchIds?.length &&
    (a.branchIds ?? []).every((id) => b.branchIds?.includes(id))
  );
}
