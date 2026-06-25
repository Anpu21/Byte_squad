import {
  CartesianGrid,
  Cell,
  ReferenceLine,
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
  branchColors,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
  branchColors?: Record<string, string>;
}) {
  const data = branches.map((branch) => ({
    id: branch.branchId,
    name: branch.branchName,
    revenue: branch.financial.revenue,
    expenseRatio: Number((branch.financial.expenseRatio * 100).toFixed(2)),
    profit: branch.financial.grossProfit,
  }));

  const revenues = data.map((row) => row.revenue);
  const ratios = data.map((row) => row.expenseRatio);
  const revenueMid =
    revenues.length > 0
      ? (Math.min(...revenues) + Math.max(...revenues)) / 2
      : 0;
  const ratioMid =
    ratios.length > 0 ? (Math.min(...ratios) + Math.max(...ratios)) / 2 : 0;
  return (
    <ChartCard
      title="Profitability quadrant"
      description="Revenue scale against expense pressure."
    >
      <div className="relative h-72">
        <span
          className="pointer-events-none absolute right-4 top-3 z-10 text-[9.5px] font-semibold uppercase tracking-wide text-text-3 opacity-70"
          aria-hidden="true"
        >
          ★ Stars
        </span>
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
            <ReferenceLine
              x={revenueMid}
              stroke="var(--border-strong)"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={ratioMid}
              stroke="var(--border-strong)"
              strokeDasharray="3 3"
            />
            <Tooltip content={<ChartTooltip />} />
            <Scatter name="Branches" data={data} fill="var(--primary)">
              {data.map((row, idx) => (
                <Cell
                  key={row.name}
                  fill={
                    branchColors?.[row.id] ??
                    CHART_COLORS[idx % CHART_COLORS.length]
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
