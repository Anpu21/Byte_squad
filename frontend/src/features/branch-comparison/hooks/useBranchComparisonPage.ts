import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@/constants/enums";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import { queryKeys } from "@/lib/queryKeys";
import type { IBranchAnalyticsComparisonRequest } from "@/types";
import { PRESET_LABELS } from "../lib/preset-ranges";
import {
  AUTO_REFRESH_DELAY_MS,
  sameRequest,
  toRequest,
  unique,
} from "./useBranchComparisonPage.lib";
import {
  buildBranchColors,
  buildChartData,
  buildLeaderboard,
  buildRevenueSpark,
  buildTotals,
  getSelectedBranchNames,
} from "./useBranchComparisonPage.derive";
import { useComparisonParams } from "./useComparisonParams";

export type { LeaderboardRow } from "./useBranchComparisonPage.lib";

export function useBranchComparisonPage() {
  const { user } = useAuth();
  const userRole = user?.role;
  const userBranchId = user?.branchId;

  // The full /branches list is multi-tenant scoped (a manager only sees their
  // own branch), which would leave the picker with nothing to compare against.
  // The branch-analytics roster returns every branch for admins AND managers.
  const branchesQuery = useQuery({
    queryKey: queryKeys.admin.branchAnalyticsBranches(),
    queryFn: adminService.getBranchAnalyticsBranches,
  });

  const {
    activePreset,
    startDate,
    endDate,
    metric,
    view,
    hasBranchIdsParam,
    requestedIds,
    setBranchIdsParam,
    setPreset,
    setStartDate,
    setEndDate,
    setMetric,
    setView,
  } = useComparisonParams();

  const branches = useMemo(
    () => branchesQuery.data ?? [],
    [branchesQuery.data],
  );
  const activeBranchIds = useMemo(
    () =>
      branches.filter((branch) => branch.isActive).map((branch) => branch.id),
    [branches],
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

  const comparisonQuery = useQuery({
    queryKey: queryKeys.admin.branchAnalyticsComparison(debouncedRequest),
    queryFn: () => adminService.compareBranchAnalytics(debouncedRequest!),
    enabled: debouncedRequest !== null,
    placeholderData: (previous) => previous,
  });

  const chartData = useMemo(
    () => buildChartData(comparisonQuery.data),
    [comparisonQuery.data],
  );
  const leaderboard = useMemo(
    () => buildLeaderboard(comparisonQuery.data, metric),
    [comparisonQuery.data, metric],
  );
  const totals = useMemo(
    () => buildTotals(comparisonQuery.data),
    [comparisonQuery.data],
  );
  const trend = comparisonQuery.data?.trend;
  const branchColors = useMemo(
    () => buildBranchColors(comparisonQuery.data?.branches),
    [comparisonQuery.data?.branches],
  );
  const revenueSpark = useMemo(
    () => buildRevenueSpark(trend),
    [trend],
  );

  const selectedBranchNames = getSelectedBranchNames(selectedIds, branches);

  const isDebouncing = !sameRequest(currentRequest, debouncedRequest);

  return {
    branches,
    selectedIds,
    lockedBranchIds,
    toggleBranch,
    selectAllBranches,
    clearBranches,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
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
    trend,
    branchColors,
    revenueSpark,
    selectedBranchNames,
  };
}
