import {
    Area,
    AreaChart as RAreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface AreaChartProps {
    data: { name: string; value: number }[];
    height?: number;
    color?: string;
    formatValue?: (value: number) => string;
    showGrid?: boolean;
    showAxes?: boolean;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

function CustomTooltip({ active, payload, label, formatter }:
    CustomTooltipProps & { formatter: (v: number) => string }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface border border-border rounded-md shadow-md-token p-2.5">
                <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-0.5">
                    {label}
                </p>
                <p className="mono text-[13px] font-semibold text-text-1">
                    {formatter(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
}

export default function AreaChart({
    data,
    height = 240,
    color = 'var(--primary)',
    formatValue = (v: number) => v.toLocaleString(),
    showGrid = true,
    showAxes = true,
}: AreaChartProps) {
    const { theme } = useTheme();
    const gradientId = `lp-area-${theme}-${color.replace(/[^a-z0-9]/gi, '')}`;

    return (
        <div style={{ height, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RAreaChart
                    data={data}
                    margin={{ top: 8, right: 8, left: showAxes ? -20 : 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="2 4"
                            vertical={false}
                            stroke="var(--border)"
                        />
                    )}

                    {showAxes && (
                        <>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 500 }}
                                dy={6}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 500 }}
                                tickFormatter={formatValue}
                                dx={-6}
                            />
                        </>
                    )}

                    <Tooltip
                        content={<CustomTooltip formatter={formatValue} />}
                        cursor={{
                            stroke: 'var(--border-strong)',
                            strokeWidth: 1,
                            strokeDasharray: '3 3',
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        activeDot={{
                            r: 4,
                            fill: 'var(--surface)',
                            stroke: color,
                            strokeWidth: 2,
                        }}
                    />
                </RAreaChart>
            </ResponsiveContainer>
        </div>
    );
}
