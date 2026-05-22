interface SparkProps {
    data: number[];
    color?: string;
    h?: number;
    fill?: boolean;
}

export default function Spark({
    data,
    color = 'var(--primary)',
    h = 32,
    fill = false,
}: SparkProps) {
    if (!data || data.length < 2) return <div style={{ height: h }} />;
    const w = 120;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const span = max - min || 1;
    const pts = data.map(
        (v, i) =>
            `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`,
    );
    const d = 'M' + pts.join(' L');
    const fillD = fill ? `${d} L${w},${h} L0,${h} Z` : null;
    return (
        <svg
            width="100%"
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
        >
            {fillD && <path d={fillD} fill={color} opacity="0.12" />}
            <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
}
