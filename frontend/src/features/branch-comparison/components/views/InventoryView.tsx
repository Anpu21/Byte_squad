import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { count } from "../../lib/format-cells";
import { MultiBranchBarChart } from "../charts/MultiBranchBarChart";
import { BranchMetricTable } from "../BranchMetricTable";

export function InventoryView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    active: branch.inventory.activeProducts,
    low: branch.inventory.lowStockItems,
    out: branch.inventory.outOfStockItems,
  }));
  return (
    <div className="space-y-4">
      <MultiBranchBarChart
        title="Inventory status"
        description="Active, low-stock, and out-of-stock products by branch."
        data={data}
        stacked
        bars={[
          {
            key: "active",
            label: "Active",
            color: "var(--primary)",
          },
          {
            key: "low",
            label: "Low stock",
            color: "var(--warning)",
          },
          {
            key: "out",
            label: "Out",
            color: "var(--danger)",
          },
        ]}
      />
      <BranchMetricTable
        title="Inventory health"
        description="Current inventory state for active products in each branch."
        branches={branches}
        columns={[
          {
            key: "active",
            header: "Active products",
            align: "right",
            render: (branch) => count(branch.inventory.activeProducts),
          },
          {
            key: "low",
            header: "Low stock",
            align: "right",
            render: (branch) => count(branch.inventory.lowStockItems),
          },
          {
            key: "out",
            header: "Out of stock",
            align: "right",
            render: (branch) => count(branch.inventory.outOfStockItems),
          },
          {
            key: "quantity",
            header: "Stock qty",
            align: "right",
            render: (branch) => count(branch.inventory.totalStockQuantity, 3),
          },
        ]}
      />
    </div>
  );
}
