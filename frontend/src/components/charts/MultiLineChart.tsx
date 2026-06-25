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

export interface MultiLineSeries {
    /** Key into each data row (the branch name). */
    key: string;
    /** Legend / tooltip label. */
    name: string;
    /** CSS colour token (e.g. 'var(--primary)'). */
    color: string;
}

interface MultiLineChartProps {
    /** One row per X tick, e.g. `{ name: 'Mon', 'Main Branch': 1234, … }`. */
    data: Record<string, string | number>[];
    series: MultiLineSeries[];
    height?: number;
    formatValue?: (value: number) => string;
}

interface MultiTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number; color: string; dataKey: string }[];
    label?: string;
    formatter: (v: number) => string;
}

function MultiTooltip({ active, payload, label, formatter }: MultiTooltipProps) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-surface border border-border rounded-md shadow-md-token p-2.5 min-w-[140px]">
            <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-1.5">
                {label}
            </p>
            <div className="flex flex-col gap-1">
                {payload.map((entry) => (
                    <div
                        key={entry.dataKey}
                        className="flex items-center justify-between gap-3"
                    >
                        <span className="flex items-center gap-1.5">
                            <span
                                className="w-2 h-2 rounded-sm"
                                style={{ background: entry.color }}
                            />
                            <span className="text-[11.5px] text-text-2">
                                {entry.name}
                            </span>
                        </span>
                        <span className="mono text-[12px] font-semibold text-text-1">
                            {formatter(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Multi-series area/line chart — one filled line per `series` entry. A sibling
 * of the single-series `AreaChart` (whose contract stays untouched); used for
 * the dashboard's per-branch "Revenue Trend". Colours are caller-supplied brand
 * tokens; grid/axes/tooltip mirror `AreaChart` for visual parity.
 */
export default function MultiLineChart({
    data,
    series,
    height = 232,
    formatValue = (v: number) => v.toLocaleString(),
}: MultiLineChartProps) {
    const { theme } = useTheme();

    return (
        <div style={{ height, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RAreaChart
                    data={data}
                    margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                    <defs>
                        {series.map((s) => (
                            <linearGradient
                                key={s.key}
                                id={`lp-ml-${theme}-${s.key.replace(/[^a-z0-9]/gi, '')}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor={s.color}
                                    stopOpacity={0.18}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={s.color}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        ))}
                    </defs>

                    <CartesianGrid
                        strokeDasharray="2 4"
                        vertical={false}
                        stroke="var(--border)"
                    />
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
                    <Tooltip
                        content={<MultiTooltip formatter={formatValue} />}
                        cursor={{
                            stroke: 'var(--border-strong)',
                            strokeWidth: 1,
                            strokeDasharray: '3 3',
                        }}
                    />
                    {series.map((s) => (
                        <Area
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#lp-ml-${theme}-${s.key.replace(/[^a-z0-9]/gi, '')})`}
                            activeDot={{
                                r: 3.5,
                                fill: 'var(--surface)',
                                stroke: s.color,
                                strokeWidth: 2,
                            }}
                        />
                    ))}
                </RAreaChart>
            </ResponsiveContainer>
        </div>
    );
}
