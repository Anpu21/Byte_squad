import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { compactCurrency } from "../../lib/format";
import { count, money } from "../../lib/format-cells";
import { CHART_COLORS } from "../../lib/chart-config";
import { ChartCard } from "../charts/ChartCard";
import { ChartTooltip } from "../charts/ChartTooltip";
import { MultiBranchBarChart } from "../charts/MultiBranchBarChart";
import { BranchMetricTable } from "../BranchMetricTable";

export function StaffView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const productivityData = branches.map((branch) => ({
    name: branch.branchName,
    revenuePerStaff: branch.staff.revenuePerStaff,
  }));
  const scatterData = branches.map((branch) => ({
    name: branch.branchName,
    staff: branch.staff.staffCount,
    revenue: branch.financial.revenue,
    profit: branch.financial.grossProfit,
  }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MultiBranchBarChart
          title="Revenue per staff"
          description="Sales output divided by assigned staff count."
          data={productivityData}
          valueType="currency"
          bars={[
            {
              key: "revenuePerStaff",
              label: "Revenue / staff",
              color: "var(--primary)",
            },
          ]}
        />
        <ChartCard
          title="Staff leverage"
          description="Staff count against revenue scale."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 8,
                  right: 16,
                  bottom: 8,
                  left: 0,
                }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="staff"
                  name="Staff"
                  tick={{
                    fill: "var(--text-3)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="revenue"
                  name="Revenue"
                  tickFormatter={compactCurrency}
                  tick={{
                    fill: "var(--text-3)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <ZAxis dataKey="profit" range={[80, 360]} />
                <Tooltip content={<ChartTooltip />} />
                <Scatter
                  name="Branches"
                  data={scatterData}
                  fill="var(--primary)"
                >
                  {scatterData.map((row, idx) => (
                    <Cell
                      key={row.name}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <BranchMetricTable
        title="Staff productivity"
        description="Staffing level and sales output per assigned staff member."
        branches={branches}
        columns={[
          {
            key: "staff",
            header: "Staff",
            align: "right",
            render: (branch) => count(branch.staff.staffCount),
          },
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
            key: "revStaff",
            header: "Revenue / staff",
            align: "right",
            render: (branch) => money(branch.staff.revenuePerStaff),
          },
        ]}
      />
    </div>
  );
}
