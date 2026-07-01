import { useState } from "react";
import DonutChart from "@/components/charts/DonutChart";
import { Select } from "@/components/ui/Select";
import type { BranchAnalyticsProductMetric, IBranchAnalyticsProductRow } from "@/types";
import { ChartCard } from "./charts/ChartCard";
import {
  buildSingleProductSlices,
  type ProductBranchInfo,
} from "./products-data";

interface ProductDrilldownPieProps {
  items: IBranchAnalyticsProductRow[];
  branches: ProductBranchInfo[];
  metric: BranchAnalyticsProductMetric;
  branchColorFor: (branchId: string) => string;
  format: (value: number) => string;
}

/**
 * Viz (c) — pick one product, see how its sales split across branches (each
 * slice a branch). Self-heals to the first product when the current selection
 * falls off the page (new search / page / sort).
 */
export function ProductDrilldownPie({
  items,
  branches,
  metric,
  branchColorFor,
  format,
}: ProductDrilldownPieProps) {
  const [productId, setProductId] = useState("");
  const selected =
    items.find((row) => row.productId === productId) ?? items[0];
  if (!selected) return null;

  const slices = buildSingleProductSlices(
    selected,
    branches,
    metric,
    branchColorFor,
  );
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <ChartCard
      title="Single-product drill-down"
      description="Pick a product to see how its sales split across branches."
    >
      <div className="mb-4">
        <Select
          aria-label="Select a product to drill down"
          value={selected.productId}
          onChange={setProductId}
          options={items.map((row) => ({
            label: row.productName,
            value: row.productId,
          }))}
          className="w-full"
        />
      </div>
      <DonutChart
        data={slices}
        formatValue={format}
        size={148}
        centerValue={total > 0 ? format(total) : undefined}
        centerLabel="total"
        emptyLabel="No sales for this product"
      />
    </ChartCard>
  );
}
