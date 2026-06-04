import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@/constants/enums";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import { userService } from "@/services/user.service";
import { queryKeys } from "@/lib/queryKeys";
import type {
  IBranchAnalyticsComparisonEntry,
  IBranchAnalyticsComparisonRequest,
} from "@/types";
import {
  COMPARISON_VIEWS,
  formatCurrencyWhole,
  formatNumber,
  toInputDate,
  type ComparisonView,
  type MetricKey,
} from "../lib/format";
import {
  PRESET_LABELS,
  PRESET_ORDER,
  resolvePreset,
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

const AUTO_REFRESH_DELAY_MS = 450;
const DEFAULT_PRESET: PresetKey = "7d";
const DEFAULT_METRIC: MetricKey = "revenue";
const DEFAULT_VIEW: ComparisonView = "summary";
const VALID_METRICS: MetricKey[] = [
  "revenue",
  "grossProfit",
  "transactions",
  "aov",
  "activeProducts",
  "loyaltyMembers",
];

function isPresetKey(value: string | null): value is PresetKey {
  return value !== null && (PRESET_ORDER as string[]).includes(value);
}

function isMetricKey(value: string | null): value is MetricKey {
  return value !== null && (VALID_METRICS as string[]).includes(value);
}

function isComparisonView(value: string | null): value is ComparisonView {
  return value !== null && (COMPARISON_VIEWS as string[]).includes(value);
}

function isInputDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseBranchIds(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function unique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

function toRequest(
  ids: readonly string[],
  start: string,
  end: string,
): IBranchAnalyticsComparisonRequest {
  return {
    branchIds: [...ids],
    startDate: new Date(start).toISOString(),
    endDate: new Date(`${end}T23:59:59.999`).toISOString(),
  };
}

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

function sameRequest(
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

export function useBranchComparisonPage() {
  const { user } = useAuth();
  const userRole = user?.role;
  const userBranchId = user?.branchId;
  const [searchParams, setSearchParams] = useSearchParams();

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.all(),
    queryFn: userService.getBranches,
  });

  const defaultRange = useMemo(() => {
    return (
      resolvePreset(DEFAULT_PRESET) ?? {
        start: new Date(),
        end: new Date(),
      }
    );
  }, []);

  const presetParam = searchParams.get("preset");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const metricParam = searchParams.get("metric");
  const viewParam = searchParams.get("view");
  const hasBranchIdsParam = searchParams.has("branchIds");

  const activePreset = isPresetKey(presetParam) ? presetParam : DEFAULT_PRESET;
  const startDate = isInputDate(startDateParam)
    ? startDateParam
    : toInputDate(defaultRange.start);
  const endDate = isInputDate(endDateParam)
    ? endDateParam
    : toInputDate(defaultRange.end);
  const metric = isMetricKey(metricParam) ? metricParam : DEFAULT_METRIC;
  const view = isComparisonView(viewParam) ? viewParam : DEFAULT_VIEW;

  const branches = useMemo(
    () => branchesQuery.data ?? [],
    [branchesQuery.data],
  );
  const activeBranchIds = useMemo(
    () =>
      branches.filter((branch) => branch.isActive).map((branch) => branch.id),
    [branches],
  );
  const branchIdsParam = searchParams.get("branchIds");
  const requestedIds = useMemo(
    () => parseBranchIds(branchIdsParam),
    [branchIdsParam],
  );
  const lockedBranchId =
    userRole === UserRole.MANAGER && userBranchId ? userBranchId : null;
  const lockedBranchIds = useMemo(
    () => (lockedBranchId ? [lockedBranchId] : []),
    [lockedBranchId],
  );
  const selectedIds = useMemo(
    () =>
      unique([
        ...lockedBranchIds,
        ...(hasBranchIdsParam ? requestedIds : activeBranchIds),
      ]),
    [activeBranchIds, hasBranchIdsParam, lockedBranchIds, requestedIds],
  );

  const dateError =
    new Date(startDate).getTime() > new Date(endDate).getTime()
      ? "Start date must be before end date."
      : null;

  const currentRequest =
    useMemo<IBranchAnalyticsComparisonRequest | null>(() => {
      if (selectedIds.length === 0 || dateError) return null;
      return toRequest(selectedIds, startDate, endDate);
    }, [dateError, endDate, selectedIds, startDate]);

  const [debouncedRequest, setDebouncedRequest] =
    useState<IBranchAnalyticsComparisonRequest | null>(currentRequest);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedRequest(currentRequest);
    }, AUTO_REFRESH_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [currentRequest]);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          mutate(params);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setBranchIdsParam = useCallback(
    (ids: readonly string[]) => {
      updateParams((params) => {
        params.set("branchIds", unique(ids).join(","));
      });
    },
    [updateParams],
  );

  const toggleBranch = (id: string) => {
    if (lockedBranchIds.includes(id)) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setBranchIdsParam(next);
  };

  const selectAllBranches = () => {
    setBranchIdsParam(activeBranchIds);
  };

  const clearBranches = () => setBranchIdsParam(lockedBranchIds);

  const setPreset = (key: PresetKey) => {
    const range = resolvePreset(key);
    updateParams((params) => {
      params.set("preset", key);
      if (range) {
        params.set("startDate", toInputDate(range.start));
        params.set("endDate", toInputDate(range.end));
      }
    });
  };

  const handleSetStartDate = (value: string) => {
    updateParams((params) => {
      params.set("startDate", value);
      params.set("preset", "custom");
    });
  };

  const handleSetEndDate = (value: string) => {
    updateParams((params) => {
      params.set("endDate", value);
      params.set("preset", "custom");
    });
  };

  const setMetric = (nextMetric: MetricKey) => {
    updateParams((params) => {
      params.set("metric", nextMetric);
    });
  };

  const setView = (nextView: ComparisonView) => {
    updateParams((params) => {
      params.set("view", nextView);
    });
  };

  const comparisonQuery = useQuery({
    queryKey: queryKeys.admin.branchAnalyticsComparison(debouncedRequest),
    queryFn: () => adminService.compareBranchAnalytics(debouncedRequest!),
    enabled: debouncedRequest !== null,
    placeholderData: (previous) => previous,
  });

  const chartData = useMemo(() => {
    if (!comparisonQuery.data) return [];
    return comparisonQuery.data.branches.map((branch) => ({
      name: branch.branchName,
      Revenue: branch.financial.revenue,
      Expenses: branch.financial.expenses,
      Profit: branch.financial.grossProfit,
    }));
  }, [comparisonQuery.data]);

  const leaderboard = useMemo<LeaderboardRow[]>(() => {
    if (!comparisonQuery.data) return [];
    const sorted = [...comparisonQuery.data.branches].sort(
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
  }, [comparisonQuery.data, metric]);

  const totals = useMemo(() => {
    if (!comparisonQuery.data) {
      return { revenue: 0, expenses: 0, transactions: 0 };
    }
    return {
      revenue: comparisonQuery.data.totals.financial.revenue,
      expenses: comparisonQuery.data.totals.financial.expenses,
      transactions: comparisonQuery.data.totals.sales.transactionCount,
    };
  }, [comparisonQuery.data]);

  const selectedBranchNames = selectedIds
    .map((id) => branches.find((branch) => branch.id === id)?.name)
    .filter(Boolean) as string[];

  const isDebouncing = !sameRequest(currentRequest, debouncedRequest);

  return {
    branches,
    selectedIds,
    lockedBranchIds,
    toggleBranch,
    selectAllBranches,
    clearBranches,
    startDate,
    setStartDate: handleSetStartDate,
    endDate,
    setEndDate: handleSetEndDate,
    metric,
    setMetric,
    view,
    setView,
    activePreset,
    setPreset,
    presetLabels: PRESET_LABELS,
    dateError,
    hasSelection: selectedIds.length > 0,
    comparison: comparisonQuery.data,
    isLoading: comparisonQuery.isLoading,
    isFetching: comparisonQuery.isFetching,
    isDebouncing,
    isAutoRefreshing: comparisonQuery.isFetching || isDebouncing,
    chartData,
    leaderboard,
    totals,
    selectedBranchNames,
  };
}
