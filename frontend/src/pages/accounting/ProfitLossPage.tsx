import { useState, useEffect } from 'react';
import { accountingService } from '@/services/accounting.service';
import type { IProfitLossData } from '@/services/accounting.service';

export default function ProfitLossPage() {
    const [data, setData] = useState<IProfitLossData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date range — default to current month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        accountingService
            .getProfitLoss(startDate, endDate)
            .then(setData)
            .catch(() => setError('Failed to load profit & loss data'))
            .finally(() => setIsLoading(false));
    }, [startDate, endDate]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Profit & Loss</h1>
                    <p className="text-sm text-slate-400 mt-1">Revenue, costs, and profitability overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 px-3 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg outline-none focus:border-white/30"
                    />
                    <span className="text-slate-500 text-sm">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 px-3 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg outline-none focus:border-white/30"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="space-y-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                            <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-4" />
                            <div className="space-y-3">
                                <div className="h-5 w-full bg-white/5 rounded animate-pulse" />
                                <div className="h-5 w-3/4 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : data ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Net Revenue"
                            value={formatCurrency(data.revenue.netRevenue)}
                            sub={`${data.revenue.totalTransactions} transactions`}
                        />
                        <SummaryCard
                            label="Gross Profit"
                            value={formatCurrency(data.grossProfit)}
                            sub={`${formatPercent(data.grossMargin)} margin`}
                            positive={data.grossProfit >= 0}
                        />
                        <SummaryCard
                            label="Total Expenses"
                            value={formatCurrency(data.expenses.total)}
                            sub={`${data.expenses.byCategory.length} categories`}
                        />
                        <SummaryCard
                            label="Net Profit"
                            value={formatCurrency(data.netProfit)}
                            sub={`${formatPercent(data.netMargin)} margin`}
                            positive={data.netProfit >= 0}
                            highlight
                        />
                    </div>

                    {/* P&L Statement */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Income Statement</h2>
                        </div>

                        <div className="divide-y divide-white/5">
                            {/* Revenue Section */}
                            <Section title="Revenue">
                                <Row label="Total Sales" value={formatCurrency(data.revenue.totalSales)} />
                                <Row label="Discounts Given" value={`-${formatCurrency(data.revenue.totalDiscounts)}`} dim />
                                <Row label="Tax Collected" value={formatCurrency(data.revenue.totalTax)} dim />
                                <Row label="Net Revenue" value={formatCurrency(data.revenue.netRevenue)} bold />
                            </Section>

                            {/* COGS Section */}
                            <Section title="Cost of Goods Sold">
                                <Row label={`Product Costs (${data.costOfGoodsSold.itemsSold} items sold)`} value={formatCurrency(data.costOfGoodsSold.totalCOGS)} />
                                <Row label="Total COGS" value={`-${formatCurrency(data.costOfGoodsSold.totalCOGS)}`} bold />
                            </Section>

                            {/* Gross Profit */}
                            <div className="px-6 py-4 flex items-center justify-between bg-white/[0.02]">
                                <span className="text-sm font-bold text-white">Gross Profit</span>
                                <div className="text-right">
                                    <span className={`text-sm font-bold tabular-nums ${data.grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(data.grossProfit)}
                                    </span>
                                    <span className="text-[11px] text-slate-500 ml-2">({formatPercent(data.grossMargin)})</span>
                                </div>
                            </div>

                            {/* Expenses Section */}
                            <Section title="Operating Expenses">
                                {data.expenses.byCategory.length > 0 ? (
                                    data.expenses.byCategory.map((cat) => (
                                        <Row key={cat.category} label={cat.category} value={formatCurrency(cat.amount)} />
                                    ))
                                ) : (
                                    <Row label="No expenses recorded" value="-" dim />
                                )}
                                <Row label="Total Expenses" value={`-${formatCurrency(data.expenses.total)}`} bold />
                            </Section>

                            {/* Net Profit */}
                            <div className="px-6 py-5 flex items-center justify-between bg-white/[0.04]">
                                <span className="text-base font-bold text-white">Net Profit</span>
                                <div className="text-right">
                                    <span className={`text-base font-bold tabular-nums ${data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(data.netProfit)}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-2">({formatPercent(data.netMargin)})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SummaryCard({ label, value, sub, positive, highlight }: {
    label: string;
    value: string;
    sub: string;
    positive?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className={`bg-[#111111] border rounded-2xl p-5 ${highlight ? 'border-white/20' : 'border-white/10'}`}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${
                positive === undefined ? 'text-white' :
                positive ? 'text-green-400' : 'text-red-400'
            }`}>{value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="py-2">
            <div className="px-6 py-3">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Row({ label, value, bold, dim }: {
    label: string;
    value: string;
    bold?: boolean;
    dim?: boolean;
}) {
    return (
        <div className="px-6 py-2.5 flex items-center justify-between">
            <span className={`text-sm ${bold ? 'font-semibold text-slate-200' : dim ? 'text-slate-500' : 'text-slate-400'}`}>
                {label}
            </span>
            <span className={`text-sm tabular-nums ${bold ? 'font-semibold text-white' : dim ? 'text-slate-500' : 'text-slate-300'}`}>
                {value}
            </span>
        </div>
    );
}
