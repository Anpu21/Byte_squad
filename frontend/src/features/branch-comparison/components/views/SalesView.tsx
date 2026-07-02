import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { count, money } from "../../lib/format-cells";
import { MultiBranchBarChart } from "@/components/charts/MultiBranchBarChart";
import { BranchMetricTable } from "../BranchMetricTable";
import { TopProductsByBranch } from "../TopProductsByBranch";
import { TopProductsComparator } from "../TopProductsComparator";

export function SalesView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    revenue: branch.financial.revenue,
    expenses: branch.financial.expenses,
    profit: branch.financial.grossProfit,
    transactions: branch.sales.transactionCount,
  }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MultiBranchBarChart
          title="Revenue, expenses, profit"
          description="Core financial comparison by branch."
          data={data}
          valueType="currency"
          bars={[
            {
              key: "revenue",
              label: "Revenue",
              color: "var(--primary)",
            },
            {
              key: "expenses",
              label: "Expenses",
              color: "var(--warning)",
            },
            {
              key: "profit",
              label: "Profit",
              color: "var(--accent)",
            },
          ]}
        />
        <MultiBranchBarChart
          title="Transaction volume"
          description="Completed sale count per branch."
          data={data}
          bars={[
            {
              key: "transactions",
              label: "Transactions",
              color: "var(--info)",
            },
          ]}
        />
      </div>
      <BranchMetricTable
        title="Sales performance"
        description="Revenue, profit, transaction volume, and checkout adjustments."
        branches={branches}
        columns={[
          {
            key: "revenue",
            header: "Revenue",
            align: "right",
            render: (branch) => money(branch.financial.revenue),
          },
          {
            key: "profit",
            header: "Profit",
            align: "right",
            render: (branch) => money(branch.financial.grossProfit),
          },
          {
            key: "transactions",
            header: "Transactions",
            align: "right",
            render: (branch) => count(branch.sales.transactionCount),
          },
          {
            key: "aov",
            header: "AOV",
            align: "right",
            render: (branch) => money(branch.sales.avgTransactionValue),
          },
          {
            key: "discounts",
            header: "Discounts",
            align: "right",
            render: (branch) => money(branch.sales.discountTotal),
          },
          {
            key: "tax",
            header: "Tax",
            align: "right",
            render: (branch) => money(branch.sales.taxTotal),
          },
        ]}
      />
      {branches.length >= 2 ? (
        <TopProductsComparator branches={branches} />
      ) : (
        branches.map((branch) => (
          <TopProductsByBranch key={branch.branchId} entry={branch} />
        ))
      )}
    </div>
  );
}
