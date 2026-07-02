import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compactCurrency, compactNumber } from "./chart-format";
import { ChartCard } from "./ChartCard";
import { ChartTooltip, type ChartRow } from "./ChartTooltip";

interface ChartBarDef {
  key: string;
  label: string;
  color: string;
  stackId?: string;
}

export function MultiBranchBarChart({
  title,
  description,
  data,
  bars,
  stacked = false,
  valueType = "number",
}: {
  title: string;
  description: string;
  data: ChartRow[];
  bars: ChartBarDef[];
  stacked?: boolean;
  valueType?: "number" | "currency";
}) {
  const formatter = valueType === "currency" ? compactCurrency : compactNumber;
  return (
    <ChartCard title={title} description={description}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatter}
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{
                color: "var(--text-2)",
                fontSize: 12,
                paddingTop: 8,
              }}
            />
            {bars.map((bar, idx) => (
              <Bar
                key={bar.key}
                name={bar.label}
                dataKey={bar.key}
                fill={bar.color}
                stackId={stacked ? "branch" : bar.stackId}
                radius={idx === bars.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
