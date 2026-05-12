import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
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

export function RevenueVsExpensesChart({
    data,
    branchCount,
}: RevenueVsExpensesChartProps) {
    return (
        <Card className="p-5 mb-6">
            <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Revenue vs expenses
                </h3>
                <p className="text-xs text-text-2 mt-0.5">
                    Compared across {branchCount} branch
                    {branchCount === 1 ? '' : 'es'}
                </p>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
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
                            tickFormatter={(v: number) =>
                                `${(v / 1000).toFixed(0)}k`
                            }
                        />
                        <Tooltip
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
                            }}
                        />
                        <Bar
                            dataKey="Revenue"
                            fill="var(--primary)"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="Expenses"
                            fill="var(--brand-400)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
