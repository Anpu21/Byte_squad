import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { money } from "../../lib/format-cells";
import { MultiBranchBarChart } from "@/components/charts/MultiBranchBarChart";
import { BranchMetricTable } from "../BranchMetricTable";

export function PaymentsView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    cash: branch.payments.cashAmount,
    card: branch.payments.cardAmount,
    mobile: branch.payments.mobileAmount,
    cheque: branch.payments.chequeAmount,
    bank: branch.payments.bankAmount,
    credit: branch.payments.creditAmount,
  }));
  return (
    <div className="space-y-4">
      <MultiBranchBarChart
        title="Tender mix"
        description="Stacked payment amount by method."
        data={data}
        stacked
        valueType="currency"
        bars={[
          { key: "cash", label: "Cash", color: "var(--primary)" },
          { key: "card", label: "Card", color: "var(--accent)" },
          { key: "credit", label: "Credit", color: "var(--danger)" },
        ]}
      />
      <BranchMetricTable
        title="Payment mix"
        description="Tender split for finalized branch sales."
        branches={branches}
        columns={[
          {
            key: "cash",
            header: "Cash",
            align: "right",
            render: (branch) => money(branch.payments.cashAmount),
          },
          {
            key: "card",
            header: "Card",
            align: "right",
            render: (branch) => money(branch.payments.cardAmount),
          },
          {
            key: "credit",
            header: "Credit",
            align: "right",
            render: (branch) => money(branch.payments.creditAmount),
          },
        ]}
      />
    </div>
  );
}
