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
import { Trophy } from 'lucide-react';
import Card from '@/components/ui/Card';
import { formatCurrencyWhole } from '../lib/format';

interface ChartRow {
    name: string;
    Revenue: number;
    Expenses: number;
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
    const leader = data.reduce<ChartRow | null>(
        (best, row) =>
            !best || row.Revenue > best.Revenue ? row : best,
        null,
    );

    return (
        <Card className="p-5 mb-6">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Revenue vs expenses
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Compared across {branchCount} branch
                        {branchCount === 1 ? '' : 'es'}
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
                aria-label={`Bar chart comparing revenue and expenses across ${branchCount} branch${branchCount === 1 ? '' : 'es'}.`}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
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
                            dataKey="Revenue"
                            fill="var(--primary)"
                            radius={[4, 4, 0, 0]}
                        >
                            <LabelList
                                dataKey="Revenue"
                                position="top"
                                fontSize={10}
                                fill="var(--text-2)"
                                formatter={(v) => compactCurrency(Number(v ?? 0))}
                            />
                        </Bar>
                        <Bar
                            dataKey="Expenses"
                            fill="var(--accent)"
                            radius={[4, 4, 0, 0]}
                        >
                            <LabelList
                                dataKey="Expenses"
                                position="top"
                                fontSize={10}
                                fill="var(--text-2)"
                                formatter={(v) => compactCurrency(Number(v ?? 0))}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
