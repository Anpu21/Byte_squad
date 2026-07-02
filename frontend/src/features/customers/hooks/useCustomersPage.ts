import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@/constants/enums";
import { useAuth } from "@/hooks/useAuth";
import { customerService } from "@/services/customers.service";
import { userService } from "@/services/user.service";
import { queryKeys } from "@/lib/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import type {
  CustomerStatus,
  IBranch,
  ICustomersListRequest,
} from "@/types";

const DEBOUNCE_MS = 350;
const TYPES = ["all", "registered", "walk-in", "khata"] as const;
export type CustomerTypeFilter = (typeof TYPES)[number];
export type CustomerStatusFilter = CustomerStatus | "all";

function asType(value: string | null): CustomerTypeFilter {
  return TYPES.includes(value as CustomerTypeFilter)
    ? (value as CustomerTypeFilter)
    : "all";
}
function asStatus(value: string | null): CustomerStatusFilter {
  return value === "active" || value === "blocked" ? value : "all";
}

/**
 * Server-paginated customers directory. Filters (search / type / status /
 * branch / page) live in the URL so the view is shareable and back-button
 * friendly; search is debounced and any filter change resets to page 1. The
 * branch filter is admin-only — managers are branch-pinned by the API.
 */
export function useCustomersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [params, setParams] = useSearchParams();

  const searchInput = params.get("q") ?? "";
  const type = asType(params.get("type"));
  const status = asStatus(params.get("status"));
  const branchId = isAdmin ? (params.get("branch") ?? "") : "";
  const pageParam = Number(params.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const setSearch = useCallback(
    (value: string) =>
      update((p) => {
        if (value) p.set("q", value);
        else p.delete("q");
        p.delete("page");
      }),
    [update],
  );
  const setType = useCallback(
    (value: CustomerTypeFilter) =>
      update((p) => {
        if (value === "all") p.delete("type");
        else p.set("type", value);
        p.delete("page");
      }),
    [update],
  );
  const setStatus = useCallback(
    (value: CustomerStatusFilter) =>
      update((p) => {
        if (value === "all") p.delete("status");
        else p.set("status", value);
        p.delete("page");
      }),
    [update],
  );
  const setBranchId = useCallback(
    (value: string) =>
      update((p) => {
        if (value) p.set("branch", value);
        else p.delete("branch");
        p.delete("page");
      }),
    [update],
  );
  const setPage = useCallback(
    (value: number) => update((p) => p.set("page", String(value))),
    [update],
  );

  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(searchInput),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const request = useMemo<ICustomersListRequest>(
    () => ({
      search: debouncedSearch.trim() || undefined,
      type,
      status: status === "all" ? undefined : status,
      branchId: branchId || undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
    [debouncedSearch, type, status, branchId, page],
  );

  const listQuery = useQuery({
    queryKey: queryKeys.customers.list(request),
    queryFn: () => customerService.list(request),
    placeholderData: (prev) => prev,
  });

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.all(),
    queryFn: userService.getBranches,
    enabled: isAdmin,
  });

  return {
    isAdmin,
    rows: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    page,
    limit: DEFAULT_PAGE_SIZE,
    setPage,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    searchInput,
    setSearch,
    type,
    setType,
    status,
    setStatus,
    branchId,
    setBranchId,
    branches: (branchesQuery.data ?? []) as IBranch[],
  };
}
