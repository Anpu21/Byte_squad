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
import { CHART_COLORS } from "../../lib/chart-config";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function ProfitabilityScatter({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    revenue: branch.financial.revenue,
    expenseRatio: Number((branch.financial.expenseRatio * 100).toFixed(2)),
    profit: branch.financial.grossProfit,
  }));
  return (
    <ChartCard
      title="Profitability quadrant"
      description="Revenue scale against expense pressure."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="revenue"
              name="Revenue"
              tickFormatter={compactCurrency}
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="expenseRatio"
              name="Expense ratio"
              unit="%"
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <ZAxis dataKey="profit" range={[80, 360]} />
            <Tooltip content={<ChartTooltip />} />
            <Scatter name="Branches" data={data} fill="var(--primary)">
              {data.map((row, idx) => (
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
  );
}
