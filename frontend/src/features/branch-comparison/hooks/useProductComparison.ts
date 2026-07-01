import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { queryKeys } from "@/lib/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import type {
  BranchAnalyticsProductMetric,
  IBranchAnalyticsProductsRequest,
  IBranchAnalyticsProductsResponse,
} from "@/types";
import { AUTO_REFRESH_DELAY_MS } from "./useBranchComparisonPage.lib";

function isMetric(value: string | null): value is BranchAnalyticsProductMetric {
  return value === "revenue" || value === "quantity";
}

export interface UseProductComparisonArgs {
  /** Resolved branch ids (from the already-fetched comparison). */
  branchIds: string[];
  /** ISO range echoed by the comparison response — reused verbatim. */
  startDate: string;
  endDate: string;
}

export interface UseProductComparisonResult {
  data: IBranchAnalyticsProductsResponse | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  searchInput: string;
  setSearch: (value: string) => void;
  sort: BranchAnalyticsProductMetric;
  setSort: (value: BranchAnalyticsProductMetric) => void;
  page: number;
  setPage: (value: number) => void;
}

/**
 * Data hook for the Products sub-tab. The branch set + date range ride in from
 * the parent comparison (zero re-plumbing of the branch/date filters); this hook
 * owns only the product-scoped controls — search / sort (= metric) / page —
 * which it keeps in the URL under `p`-prefixed params so they don't collide with
 * the comparison's own bag. Search is debounced; changing search or sort resets
 * to page 1.
 */
export function useProductComparison({
  branchIds,
  startDate,
  endDate,
}: UseProductComparisonArgs): UseProductComparisonResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = isMetric(searchParams.get("pSort"))
    ? (searchParams.get("pSort") as BranchAnalyticsProductMetric)
    : "revenue";
  const searchInput = searchParams.get("pSearch") ?? "";
  const pageParam = Number(searchParams.get("pPage"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const update = useCallback(
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

  const setSearch = useCallback(
    (value: string) =>
      update((params) => {
        if (value) params.set("pSearch", value);
        else params.delete("pSearch");
        params.delete("pPage"); // new query → back to page 1
      }),
    [update],
  );

  const setSort = useCallback(
    (value: BranchAnalyticsProductMetric) =>
      update((params) => {
        params.set("pSort", value);
        params.delete("pPage"); // re-rank → back to page 1
      }),
    [update],
  );

  const setPage = useCallback(
    (value: number) => update((params) => params.set("pPage", String(value))),
    [update],
  );

  // Debounce the free-text search so each keystroke doesn't refetch.
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(searchInput),
      AUTO_REFRESH_DELAY_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const request = useMemo<IBranchAnalyticsProductsRequest | null>(() => {
    if (branchIds.length === 0) return null;
    return {
      branchIds,
      startDate,
      endDate,
      search: debouncedSearch.trim() || undefined,
      sort,
      page,
      limit: DEFAULT_PAGE_SIZE,
    };
  }, [branchIds, startDate, endDate, debouncedSearch, sort, page]);

  const query = useQuery({
    queryKey: queryKeys.admin.branchAnalyticsProducts(request),
    queryFn: () => adminService.compareBranchAnalyticsProducts(request!),
    enabled: request !== null,
    placeholderData: (previous) => previous,
  });

  const isDebouncing = debouncedSearch !== searchInput;

  return {
    data: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching || isDebouncing,
    searchInput,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
  };
}
