import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Card from '@/components/ui/Card';
import { formatCurrencyWhole } from '../lib/format';

interface BranchSalesChartProps {
    weekTotal: number;
    chartData: { label: string; sales: number }[];
}

interface TooltipPayload {
    active?: boolean;
    payload?: { value: number; payload: { label: string } }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-surface border border-border rounded-md p-3 shadow-md-token">
            <p className="text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1">
                {payload[0].payload.label}
            </p>
            <p className="mono text-sm font-bold text-text-1">
                {formatCurrencyWhole(payload[0].value)}
            </p>
        </div>
    );
}

export function BranchSalesChart({
    weekTotal,
    chartData,
}: BranchSalesChartProps) {
    return (
        <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Sales — last 7 days
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Total:{' '}
                        <span className="mono font-medium text-text-1">
                            {formatCurrencyWhole(weekTotal)}
                        </span>
                    </p>
                </div>
            </div>
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="colorBranchSales"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--primary)"
                                    stopOpacity={0.25}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--primary)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                            dy={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                            tickFormatter={(value: number) => `${value / 1000}k`}
                            dx={-4}
                        />
                        <Tooltip
                            content={<ChartTooltip />}
                            cursor={{
                                stroke: 'var(--border-strong)',
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBranchSales)"
                            activeDot={{
                                r: 4,
                                fill: 'var(--primary)',
                                stroke: 'var(--surface)',
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
