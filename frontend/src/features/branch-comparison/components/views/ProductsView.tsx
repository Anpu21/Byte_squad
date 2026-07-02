import { useCallback, useMemo } from "react";
import { LuSearch as Search } from "react-icons/lu";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Segmented from "@/components/ui/Segmented";
import { CHART_COLORS } from "@/components/charts/chart-palette";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import type { IBranchAnalyticsComparisonResponse } from "@/types";
import { useProductComparison } from "../../hooks/useProductComparison";
import { formatCurrencyWhole, formatNumber } from "../../lib/format";
import { PRODUCT_METRIC_OPTIONS } from "../../lib/products-metric-options";
import { MultiBranchBarChart } from "../charts/MultiBranchBarChart";
import {
  buildGroupedBarChart,
  buildProductColors,
  buildProductTableRows,
  type ProductBranchInfo,
} from "../products-data";
import { buildProductInsights } from "../products-insights";
import { ProductComparisonTable } from "../ProductComparisonTable";
import { ProductDrilldownPie } from "../ProductDrilldownPie";
import { ProductInsightsStrip } from "../ProductInsightsStrip";
import { ProductMixGrid } from "../ProductMixGrid";

/**
 * Products sub-tab — accurate per-product cross-branch comparison. Branch set +
 * date range come from the parent `comparison` (already resolved / RBAC-scoped);
 * this view owns only product search / metric / page via `useProductComparison`,
 * and renders the four visualizations + the key-differences strip.
 */
export function ProductsView({
  comparison,
  branchColors,
}: {
  comparison: IBranchAnalyticsComparisonResponse;
  branchColors: Record<string, string>;
}) {
  const branches = useMemo<ProductBranchInfo[]>(
    () =>
      comparison.branches.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
      })),
    [comparison.branches],
  );
  const branchIds = useMemo(() => branches.map((b) => b.branchId), [branches]);

  const {
    data,
    isLoading,
    isRefreshing,
    searchInput,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
  } = useProductComparison({
    branchIds,
    startDate: comparison.startDate,
    endDate: comparison.endDate,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const metric = sort;
  const format = metric === "quantity" ? formatNumber : formatCurrencyWhole;

  const productColorFor = useMemo(() => {
    const map = buildProductColors(items);
    return (productId: string) => map[productId] ?? CHART_COLORS[0];
  }, [items]);

  const branchColorFor = useCallback(
    (branchId: string) => {
      const idx = branchIds.indexOf(branchId);
      return (
        branchColors[branchId] ??
        CHART_COLORS[(idx < 0 ? 0 : idx) % CHART_COLORS.length]
      );
    },
    [branchColors, branchIds],
  );

  const grouped = useMemo(
    () => buildGroupedBarChart(items, branches, metric, branchColorFor),
    [items, branches, metric, branchColorFor],
  );
  const tableRows = useMemo(
    () => buildProductTableRows(items, branches, metric),
    [items, branches, metric],
  );
  const insights = useMemo(
    () => buildProductInsights(tableRows, branches, format),
    [tableRows, branches, format],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Segmented
            value={sort}
            options={PRODUCT_METRIC_OPTIONS}
            onChange={setSort}
          />
          {isRefreshing && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-soft-text">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Updating
            </span>
          )}
        </div>
        <div className="sm:w-64">
          <Input
            aria-label="Search products"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            title={isLoading ? "Loading products…" : "No product sales to compare"}
            description={
              isLoading
                ? undefined
                : "Try a wider date range, different branches, or clear the search."
            }
          />
        </Card>
      ) : (
        <>
          <ProductInsightsStrip insights={insights} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MultiBranchBarChart
                title={
                  metric === "quantity"
                    ? "Units sold by branch"
                    : "Revenue by branch"
                }
                description="Every product on this page, one bar per branch — the direct A-vs-B read."
                data={grouped.data}
                bars={grouped.bars}
                valueType={metric === "quantity" ? "number" : "currency"}
              />
            </div>
            <ProductDrilldownPie
              items={items}
              branches={branches}
              metric={metric}
              branchColorFor={branchColorFor}
              format={format}
            />
          </div>

          <ProductMixGrid
            items={items}
            branches={branches}
            metric={metric}
            productColorFor={productColorFor}
            format={format}
          />

          <ProductComparisonTable
            rows={tableRows}
            branches={branches}
            metric={metric}
            branchColorFor={branchColorFor}
            format={format}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
