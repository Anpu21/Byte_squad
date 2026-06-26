import Card from '@/components/ui/Card';
import { EmptyState } from '@/components/ui';
import MultiLineChart, {
    type MultiLineSeries,
} from '@/components/charts/MultiLineChart';
import type { IDailyBreakdownByBranch } from '@/types';
import { formatCompact, formatDayShort } from '../lib/format';

interface RevenueTrendCardProps {
    trend: IDailyBreakdownByBranch | undefined;
    branchColors: Record<string, string>;
}

export function RevenueTrendCard({ trend, branchColors }: RevenueTrendCardProps) {
    const branches = trend?.branches ?? [];

    const series: MultiLineSeries[] = branches.map((b) => ({
        key: b.branchName,
        name: b.branchName,
        color: branchColors[b.branchId] ?? 'var(--brand-400)',
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

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Revenue Trend
                </h3>
                {/* v1 cosmetic placeholder — static period chip, no handler yet */}
                <span className="mono text-[11px] text-text-3 border border-border rounded-md px-2 py-1">
                    Last 7 days
                </span>
            </div>

            {branches.length === 0 ? (
                <EmptyState title="No revenue yet" />
            ) : (
                <>
                    {/* compact legend — MultiLineChart has no built-in legend */}
                    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                        {series.map((s) => (
                            <li key={s.key} className="flex items-center gap-1.5">
                                <span
                                    aria-hidden="true"
                                    className="size-2.5 rounded-full"
                                    style={{ background: s.color }}
                                />
                                <span className="text-[12px] text-text-2">
                                    {s.name}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <MultiLineChart
                        data={rows}
                        series={series}
                        formatValue={formatCompact}
                    />
                </>
            )}
        </Card>
    );
}
