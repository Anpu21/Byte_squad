import DonutChart from "@/components/charts/DonutChart";
import type { BranchAnalyticsProductMetric, IBranchAnalyticsProductRow } from "@/types";
import { ChartCard } from "@/components/charts/ChartCard";
import {
  buildProductMixByBranch,
  type ProductBranchInfo,
} from "./products-data";

interface ProductMixGridProps {
  items: IBranchAnalyticsProductRow[];
  branches: ProductBranchInfo[];
  metric: BranchAnalyticsProductMetric;
  productColorFor: (productId: string) => string;
  format: (value: number) => string;
}

/**
 * Viz (a) — one donut per branch, each showing that branch's product mix. A
 * product keeps the SAME colour in every ring (shared legend up top), so the
 * eye can compare "how big is bananas here vs there" directly.
 */
export function ProductMixGrid({
  items,
  branches,
  metric,
  productColorFor,
  format,
}: ProductMixGridProps) {
  const noun = metric === "quantity" ? "units" : "revenue";
  const legend = items.slice(0, 8);
  const hasOther = items.length > legend.length;

  return (
    <ChartCard
      title="Product mix per branch"
      description={`How each branch's ${noun} splits across products — colours are shared across every ring.`}
    >
      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5">
        {legend.map((row) => (
          <span
            key={row.productId}
            className="inline-flex items-center gap-1.5 text-[11.5px] text-text-2"
          >
            <span
              className="size-2.5 flex-none rounded-sm"
              style={{ backgroundColor: productColorFor(row.productId) }}
              aria-hidden="true"
            />
            <span className="max-w-[140px] truncate">{row.productName}</span>
          </span>
        ))}
        {hasOther && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-3">
            <span
              className="size-2.5 flex-none rounded-sm"
              style={{ backgroundColor: "var(--text-3)" }}
              aria-hidden="true"
            />
            Other
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => {
          const slices = buildProductMixByBranch(
            items,
            branch,
            metric,
            productColorFor,
          );
          const total = slices.reduce((sum, s) => sum + s.value, 0);
          return (
            <div
              key={branch.branchId}
              className="flex min-w-0 flex-col items-center"
            >
              <DonutChart
                data={slices}
                formatValue={format}
                showLegend={false}
                size={140}
                centerValue={total > 0 ? format(total) : undefined}
                centerLabel={noun}
                emptyLabel="No sales"
              />
              <p className="mt-2 max-w-full truncate text-center text-[12.5px] font-semibold text-text-1">
                {branch.branchName}
              </p>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
