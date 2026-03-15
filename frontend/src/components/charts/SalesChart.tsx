import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

// Mock data for the last 7 days
const data = [
    { date: 'Mon', sales: 2400 },
    { date: 'Tue', sales: 1398 },
    { date: 'Wed', sales: 5800 },
    { date: 'Thu', sales: 3908 },
    { date: 'Fri', sales: 4800 },
    { date: 'Sat', sales: 8390 },
    { date: 'Sun', sales: 7200 },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

// Custom Tooltip to match the dark monochrome theme
const CustomTooltip = ({ active, payload, label } : CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {label}
                </p>
                <p className="text-sm font-bold text-white tabular-nums">
                    {new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        maximumFractionDigits: 0
                    }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export default function SalesChart() {
    return (
        <div className="h-[280px] w-full mt-4 animate-in fade-in duration-1000">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                    {/* SVG Gradient definition for the chart fill */}
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {/* Subtle horizontal grid lines only */}
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="rgba(255,255,255,0.05)" 
                    />

                    {/* Cleaned up axes without harsh boundary lines */}
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(value) => `$${value}`}
                        dx={-10}
                    />

                    {/* Interactive hover tooltip */}
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ 
                            stroke: 'rgba(255,255,255,0.2)', 
                            strokeWidth: 1, 
                            strokeDasharray: '4 4' 
                        }} 
                    />

                    {/* The main chart line and gradient area */}
                    <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#ffffff"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        activeDot={{ 
                            r: 4, 
                            fill: '#0a0a0a', 
                            stroke: '#ffffff', 
                            strokeWidth: 2 
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}