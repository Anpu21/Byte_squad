import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeaderboardRow } from "../../hooks/useBranchComparisonPage";
import { compactNumber } from "../../lib/format";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function BranchRankingChart({ rows }: { rows: LeaderboardRow[] }) {
  const data = [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row) => ({
      name: row.entry.branchName,
      value: row.value,
    }));
  return (
    <ChartCard
      title="Branch ranking"
      description="Selected leaderboard metric across compared branches."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 12 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={compactNumber}
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "var(--text-2)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              name="Metric"
              dataKey="value"
              fill="var(--primary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
