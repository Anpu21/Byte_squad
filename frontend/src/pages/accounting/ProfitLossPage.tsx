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
        let cancelled = false;
        const load = async () => {
            try {
                const result = await accountingService.getProfitLoss(startDate, endDate);
                if (!cancelled) { setData(result); setError(null); }
            } catch {
                if (!cancelled) setError('Failed to load profit & loss data');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [startDate, endDate]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">Profit & Loss</h1>
                    <p className="text-sm text-text-2 mt-1">Revenue, costs, and profitability overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                    />
                    <span className="text-text-3 text-sm">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 px-3 bg-canvas border border-border text-text-1 text-sm rounded-lg outline-none focus:border-primary/40"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-danger-soft border border-danger/30 rounded-xl text-sm text-danger">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="space-y-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-surface border border-border rounded-md p-6">
                            <div className="h-6 w-40 bg-surface-2 rounded animate-pulse mb-4" />
                            <div className="space-y-3">
                                <div className="h-5 w-full bg-surface-2 rounded animate-pulse" />
                                <div className="h-5 w-3/4 bg-surface-2 rounded animate-pulse" />
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
                            highlight
                        />
                    </div>

                    {/* P&L Statement */}
                    <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-border bg-surface-2">
                            <h2 className="text-sm font-semibold text-text-1 uppercase tracking-wider">Income Statement</h2>
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
                            <div className="px-6 py-4 flex items-center justify-between bg-surface-2">
                                <span className="text-sm font-bold text-text-1">Gross Profit</span>
                                <div className="text-right">
                                    <span className="text-sm font-bold tabular-nums text-text-1">
                                        {formatCurrency(data.grossProfit)}
                                    </span>
                                    <span className="text-[11px] text-text-3 ml-2">({formatPercent(data.grossMargin)})</span>
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
                            <div className="px-6 py-5 flex items-center justify-between bg-surface-2">
                                <span className="text-base font-bold text-text-1">Net Profit</span>
                                <div className="text-right">
                                    <span className="text-base font-bold tabular-nums text-text-1">
                                        {formatCurrency(data.netProfit)}
                                    </span>
                                    <span className="text-xs text-text-3 ml-2">({formatPercent(data.netMargin)})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SummaryCard({ label, value, sub, highlight }: {
    label: string;
    value: string;
    sub: string;
    highlight?: boolean;
}) {
    return (
        <div className={`bg-surface border rounded-md p-5 ${highlight ? 'border-border-strong' : 'border-border'}`}>
            <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-xl font-bold tabular-nums text-text-1">{value}</p>
            <p className="text-[11px] text-text-3 mt-1">{sub}</p>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="py-2">
            <div className="px-6 py-3">
                <h3 className="text-[11px] font-semibold text-text-3 uppercase tracking-widest">{title}</h3>
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
            <span className={`text-sm ${bold ? 'font-semibold text-text-1' : dim ? 'text-text-3' : 'text-text-2'}`}>
                {label}
            </span>
            <span className={`text-sm tabular-nums ${bold ? 'font-semibold text-text-1' : dim ? 'text-text-3' : 'text-text-1'}`}>
                {value}
            </span>
        </div>
    );
}
