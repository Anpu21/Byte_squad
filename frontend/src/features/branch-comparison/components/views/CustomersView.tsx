import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { count } from "../../lib/format-cells";
import { MultiBranchBarChart } from "@/components/charts/MultiBranchBarChart";
import { BranchMetricTable } from "../BranchMetricTable";

export function CustomersView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    completed: branch.customers.completedOrders,
    cancelled: branch.customers.cancelledOrders,
    rejected: branch.customers.rejectedOrders,
  }));
  return (
    <div className="space-y-4">
      <MultiBranchBarChart
        title="Pickup order outcomes"
        description="Completed, cancelled, and rejected pickup orders."
        data={data}
        stacked
        bars={[
          {
            key: "completed",
            label: "Completed",
            color: "var(--accent)",
          },
          {
            key: "cancelled",
            label: "Cancelled",
            color: "var(--warning)",
          },
          {
            key: "rejected",
            label: "Rejected",
            color: "var(--danger)",
          },
        ]}
      />
      <BranchMetricTable
        title="Customer orders"
        description="Pickup order outcomes and unique customers in the selected period."
        branches={branches}
        columns={[
          {
            key: "pickup",
            header: "Pickup orders",
            align: "right",
            render: (branch) => count(branch.customers.pickupOrders),
          },
          {
            key: "completed",
            header: "Completed",
            align: "right",
            render: (branch) => count(branch.customers.completedOrders),
          },
          {
            key: "cancelled",
            header: "Cancelled",
            align: "right",
            render: (branch) => count(branch.customers.cancelledOrders),
          },
          {
            key: "rejected",
            header: "Rejected",
            align: "right",
            render: (branch) => count(branch.customers.rejectedOrders),
          },
          {
            key: "unique",
            header: "Unique customers",
            align: "right",
            render: (branch) => count(branch.customers.uniqueCustomers),
          },
        ]}
      />
    </div>
  );
}
