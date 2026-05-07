import {
    Bar,
    BarChart as RBarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface BarChartProps {
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

export default function BarChart({
    data,
    height = 200,
    color = 'var(--primary)',
    formatValue = (v: number) => v.toLocaleString(),
    showGrid = true,
    showAxes = true,
}: BarChartProps) {
    // Re-render on theme change so SVG colors refresh
    useTheme();
    return (
        <div style={{ height, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RBarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: showAxes ? -20 : 0, bottom: 0 }}
                >
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
                        cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }}
                    />

                    <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                </RBarChart>
            </ResponsiveContainer>
        </div>
    );
}
