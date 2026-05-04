import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { userService } from '@/services/user.service';
import type { IBranchComparisonEntry } from '@/types';

function formatCurrency(n: number): string {
    return `LKR ${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatPercent(n: number): string {
    return `${(n * 100).toFixed(1)}%`;
}

function toInputDate(d: Date): string {
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BranchComparisonPage() {
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: userService.getBranches,
    });

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>(toInputDate(thirtyDaysAgo));
    const [endDate, setEndDate] = useState<string>(toInputDate(today));
    const [submitted, setSubmitted] = useState<{
        branchIds: string[];
        startDate: string;
        endDate: string;
    } | null>(null);

    const toggleBranch = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleRun = () => {
        if (selectedIds.length < 1) return;
        setSubmitted({
            branchIds: selectedIds,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(`${endDate}T23:59:59.999`).toISOString(),
        });
    };

    const { data: comparison, isLoading, isFetching } = useQuery({
        queryKey: ['admin-comparison', submitted],
        queryFn: () => adminService.compareBranches(submitted!),
        enabled: submitted !== null,
    });

    const chartData = useMemo(() => {
        if (!comparison) return [];
        return comparison.branches.map((b) => ({
            name: b.branchName,
            Revenue: b.revenue,
            Expenses: b.expenses,
        }));
    }, [comparison]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Branch Comparison
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Side-by-side analytics for any branches over a date range
                </p>
            </div>

            {/* Filters */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-5">
                <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                        Branches
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {branches.length === 0 ? (
                            <p className="text-sm text-slate-500">No branches available</p>
                        ) : (
                            branches.map((b) => {
                                const active = selectedIds.includes(b.id);
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => toggleBranch(b.id)}
                                        className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
                                            active
                                                ? 'bg-white text-slate-900 border-white'
                                                : 'bg-[#0a0a0a] text-slate-300 border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        {b.name}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleRun}
                            disabled={selectedIds.length < 1 || isFetching}
                            className="w-full h-9 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isFetching ? 'Running...' : 'Run Comparison'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {!submitted && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-16 text-center text-slate-500 text-sm">
                    Select at least one branch and click Run Comparison to see results.
                </div>
            )}

            {submitted && isLoading && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-16 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {comparison && !isLoading && (
                <>
                    {/* Metric cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {comparison.branches.map((b) => (
                            <MetricCard key={b.branchId} entry={b} />
                        ))}
                    </div>

                    {/* Revenue vs Expenses chart */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">
                            Revenue vs Expenses
                        </h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.08)"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#64748b"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8,
                                        }}
                                        formatter={(value: number | undefined) =>
                                            formatCurrency(value || 0)
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="Revenue" fill="#ffffff" radius={[4, 4, 0, 0]} />
                                    <Bar
                                        dataKey="Expenses"
                                        fill="#64748b"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top products per branch */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {comparison.branches.map((b) => (
                            <TopProductsTable key={b.branchId} entry={b} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function MetricCard({ entry }: { entry: IBranchComparisonEntry }) {
    return (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-white truncate">
                {entry.branchName}
            </p>
            <div className="space-y-2 text-[13px]">
                <Row label="Revenue" value={formatCurrency(entry.revenue)} />
                <Row label="Expenses" value={formatCurrency(entry.expenses)} />
                <Row label="Expense Ratio" value={formatPercent(entry.expenseRatio)} />
                <Row
                    label="Transactions"
                    value={entry.transactionCount.toLocaleString()}
                />
                <Row
                    label="Avg Txn Value"
                    value={formatCurrency(entry.avgTransactionValue)}
                />
                <Row label="Staff" value={entry.staffCount.toLocaleString()} />
                <Row
                    label="Revenue / Staff"
                    value={formatCurrency(entry.revenuePerStaff)}
                />
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-200 font-medium">{value}</span>
        </div>
    );
}

function TopProductsTable({ entry }: { entry: IBranchComparisonEntry }) {
    return (
        <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
                <p className="text-sm font-semibold text-white">
                    Top Products — {entry.branchName}
                </p>
            </div>
            {entry.topProducts.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                    No sales in this range
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                            <th className="px-5 py-3 font-semibold">Product</th>
                            <th className="px-5 py-3 font-semibold text-right">Qty</th>
                            <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {entry.topProducts.map((p) => (
                            <tr
                                key={p.productId}
                                className="border-b border-white/5 last:border-b-0"
                            >
                                <td className="px-5 py-3 text-slate-200">{p.productName}</td>
                                <td className="px-5 py-3 text-right text-slate-300">
                                    {p.quantity.toLocaleString()}
                                </td>
                                <td className="px-5 py-3 text-right text-slate-300">
                                    {formatCurrency(p.revenue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
