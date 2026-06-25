import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { LuTrophy as Trophy } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import { formatCurrencyWhole } from '../lib/format';

interface ChartRow {
    name: string;
    Revenue: number;
    Expenses: number;
    Profit: number;
}

interface RevenueVsExpensesChartProps {
    data: ChartRow[];
    branchCount: number;
}

function compactCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(0)}k`;
    }
    return value.toLocaleString();
}

export function RevenueVsExpensesChart({
    data,
    branchCount,
}: RevenueVsExpensesChartProps) {
    const meanRevenue =
        data.length > 0
            ? data.reduce((sum, d) => sum + d.Revenue, 0) / data.length
            : 0;
    const totalRevenue = (row: ChartRow) => row.Profit + row.Expenses;
    const leader = data.reduce<ChartRow | null>(
        (best, row) =>
            !best || totalRevenue(row) > totalRevenue(best) ? row : best,
        null,
    );

    // Pre-derive the per-branch "X% cost" label so the LabelList can read it via
    // dataKey (Recharts 3.7's valueAccessor typing is too strict for inline use).
    const rows = data.map((row) => {
        const total = totalRevenue(row);
        return {
            ...row,
            costLabel:
                total > 0
                    ? `${((row.Expenses / total) * 100).toFixed(1)}% cost`
                    : '',
        };
    });

    return (
        <Card className="p-5 mb-6">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Revenue composition
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Each bar is total revenue — split into gross profit and
                        operating cost
                        {data.length > 0 && (
                            <>
                                {' '}
                                · Avg revenue{' '}
                                <span className="text-text-1 font-medium mono">
                                    {formatCurrencyWhole(meanRevenue)}
                                </span>
                            </>
                        )}
                    </p>
                </div>
                {leader && (
                    <div className="hidden sm:flex items-center gap-2 bg-primary-soft/40 border border-primary/20 rounded-full px-3 py-1.5">
                        <Trophy size={12} className="text-primary-soft-text" />
                        <p className="text-[11px] font-semibold text-primary-soft-text leading-none">
                            Leader · {leader.name}
                        </p>
                    </div>
                )}
            </div>
            <div
                className="h-72"
                role="img"
                aria-label={`Bar chart showing revenue composition across ${branchCount} branch${branchCount === 1 ? '' : 'es'}.`}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={rows}
                        margin={{ top: 24, right: 12, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            stroke="var(--text-3)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--text-3)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => compactCurrency(v)}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--surface-2)', opacity: 0.5 }}
                            contentStyle={{
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                color: 'var(--text-1)',
                                fontSize: 12,
                            }}
                            formatter={(value: number | undefined) =>
                                formatCurrencyWhole(value || 0)
                            }
                        />
                        <Legend
                            wrapperStyle={{
                                fontSize: 12,
                                color: 'var(--text-2)',
                                paddingTop: 8,
                            }}
                        />
                        {meanRevenue > 0 && (
                            <ReferenceLine
                                y={meanRevenue}
                                stroke="var(--text-3)"
                                strokeDasharray="4 4"
                                strokeOpacity={0.6}
                            />
                        )}
                        <Bar
                            dataKey="Profit"
                            name="Gross profit"
                            stackId="composition"
                            fill="var(--accent)"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="Expenses"
                            name="Expenses"
                            stackId="composition"
                            fill="var(--warning)"
                            radius={[4, 4, 0, 0]}
                        >
                            <LabelList
                                dataKey="costLabel"
                                position="top"
                                fontSize={10}
                                fill="var(--warning)"
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
