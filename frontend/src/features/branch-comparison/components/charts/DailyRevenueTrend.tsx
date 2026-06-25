import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import MultiLineChart, {
  type MultiLineSeries,
} from "@/components/charts/MultiLineChart";
import type { IBranchAnalyticsTrend } from "@/types";
import { compactCurrency, formatCurrencyWhole, formatDayShort } from "../../lib/format";

interface DailyRevenueTrendProps {
  trend: IBranchAnalyticsTrend | undefined;
  branchColors: Record<string, string>;
}

/**
 * Summary-view centerpiece: per-branch daily revenue across the selected range
 * (one line per compared branch). Pivots the backend `trend` shape
 * ({ branches, days[].byBranch }) into Recharts rows; colours come from the
 * shared `branchColors` map so a branch reads the same colour as its chip,
 * ranking bar and leaderboard dot.
 */
export function DailyRevenueTrend({ trend, branchColors }: DailyRevenueTrendProps) {
  const branches = trend?.branches ?? [];

  const series: MultiLineSeries[] = branches.map((b) => ({
    key: b.branchName,
    name: b.branchName,
    color: branchColors[b.branchId] ?? "var(--brand-400)",
  }));

  const rows = (trend?.days ?? []).map((d) => {
    const row: Record<string, string | number> = {
      name: formatDayShort(d.date),
    };
    for (const b of branches) {
      row[b.branchName] = d.byBranch[b.branchId] ?? 0;
    }
    return row;
  });

  const combined = (trend?.days ?? []).reduce(
    (sum, d) =>
      sum + Object.values(d.byBranch).reduce((acc, v) => acc + v, 0),
    0,
  );

  return (
    <Card className="mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-text-1">
            Daily revenue
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-3">
            Combined{" "}
            <span className="mono font-medium text-text-2">
              {formatCurrencyWhole(combined)}
            </span>{" "}
            across the period
          </p>
        </div>
        {/* legend — MultiLineChart has no built-in legend */}
        {series.length > 0 && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-[3px] w-4 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-[12px] text-text-2">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {branches.length === 0 ? (
        <EmptyState title="No revenue in this range" />
      ) : (
        <MultiLineChart
          data={rows}
          series={series}
          formatValue={compactCurrency}
        />
      )}
    </Card>
  );
}
