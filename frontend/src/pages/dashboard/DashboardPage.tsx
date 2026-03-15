export default function DashboardPage() {
    // Mock data to give the dashboard a realistic, premium feel
    const stats = [
        { 
            title: "Today's Sales", 
            value: "$4,250.00", 
            trend: "+12.5%", 
            isPositive: true,
            icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        },
        { 
            title: "Total Revenue", 
            value: "$124,560.00", 
            trend: "+8.2%", 
            isPositive: true,
            icon: <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        },
        { 
            title: "Active Products", 
            value: "842", 
            trend: "+14 this week", 
            isPositive: true,
            icon: <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        },
        { 
            title: "Low Stock Items", 
            value: "12", 
            trend: "Requires attention", 
            isPositive: false,
            icon: <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" />
        },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">Overview of your store's performance</p>
                </div>
                {/* Optional: Add a subtle secondary action button */}
                <button className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Export Report
                </button>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat) => (
                    <div 
                        key={stat.title} 
                        className="bg-[#111111] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-[#161616] transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-[13px] font-medium text-slate-400">
                                {stat.title}
                            </p>
                            <div className="p-2 bg-white/5 rounded-lg text-slate-300">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {stat.icon}
                                </svg>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-white tracking-tight">
                                {stat.value}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                                {/* Trend Indicator - kept monochrome to match aesthetic */}
                                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${stat.isPositive ? 'text-white' : 'text-slate-400'}`}>
                                    {stat.isPositive ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m18 15-6-6-6 6"/>
                                        </svg>
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6"/>
                                        </svg>
                                    )}
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Chart Card 1 */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white tracking-wide">
                            Sales Overview
                        </h3>
                        {/* Mock filter */}
                        <select className="bg-transparent border border-white/10 text-slate-300 text-xs rounded-md px-2 py-1 outline-none focus:border-white/30 cursor-pointer appearance-none">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    {/* Placeholder styling */}
                    <div className="h-[280px] w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-3 text-slate-500">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        <span className="text-xs tracking-wider uppercase font-medium">Chart rendering zone</span>
                    </div>
                </div>

                {/* Chart Card 2 */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white tracking-wide">
                            Top Selling Products
                        </h3>
                        <button className="text-xs text-slate-400 hover:text-white transition-colors font-medium">
                            View All →
                        </button>
                    </div>
                    {/* Placeholder styling */}
                    <div className="h-[280px] w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-3 text-slate-500">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M212 21.2a10 10 0 0 0-10-10V21.2h10Z" />
                            <path d="M12 2v10l8.6 5a10 10 0 1 0-8.6-15Z" />
                        </svg>
                        <span className="text-xs tracking-wider uppercase font-medium">Chart rendering zone</span>
                    </div>
                </div>
            </div>
        </div>
    );
}