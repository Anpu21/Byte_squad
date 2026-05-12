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
import { queryKeys } from '@/lib/queryKeys';
import type { IBranchComparisonEntry } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';
import EmptyState from '@/components/ui/EmptyState';
import { GitCompareArrows, X } from 'lucide-react';

type MetricKey = 'revenue' | 'transactions' | 'aov';

function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(n);
}

function formatPercent(n: number): string {
    return `${(n * 100).toFixed(1)}%`;
}

function toInputDate(d: Date): string {
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateRange(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const sameYear = s.getFullYear() === e.getFullYear();
    const opts: Intl.DateTimeFormatOptions = sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

interface BranchComparisonPageProps {
    embedded?: boolean;
}

export default function BranchComparisonPage({
    embedded = false,
}: BranchComparisonPageProps = {}) {
    const { data: branches = [] } = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>(toInputDate(sevenDaysAgo));
    const [endDate, setEndDate] = useState<string>(toInputDate(today));
    const [metric, setMetric] = useState<MetricKey>('revenue');
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

    const metricOptions: { label: string; value: MetricKey }[] = [
        { label: 'Revenue', value: 'revenue' },
        { label: 'Transactions', value: 'transactions' },
        { label: 'AOV', value: 'aov' },
    ];

    const selectedBranchNames = selectedIds
        .map((id) => branches.find((b) => b.id === id)?.name)
        .filter(Boolean) as string[];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!embedded && (
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            Compare branches
                        </h1>
                        <p className="text-xs text-text-2 mt-1">
                            {formatDateRange(startDate, endDate)}
                        </p>
                    </div>
                    {comparison && (
                        <Segmented
                            value={metric}
                            options={metricOptions}
                            onChange={setMetric}
                        />
                    )}
                </div>
            )}

            {/* Filter Card */}
            <Card className="p-5 mb-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-2">
                            Branches
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {branches.length === 0 ? (
                                <p className="text-sm text-text-3">
                                    No branches available
                                </p>
                            ) : (
                                branches.map((b) => {
                                    const active = selectedIds.includes(b.id);
                                    return (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => toggleBranch(b.id)}
                                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
                                                active
                                                    ? 'bg-primary text-text-inv border-primary'
                                                    : 'bg-surface text-text-1 border-border-strong hover:bg-surface-2'
                                            }`}
                                        >
                                            {b.name}
                                            {active && (
                                                <X
                                                    size={12}
                                                    className="opacity-80"
                                                />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1.5">
                                Start date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full h-9 px-3 bg-surface border border-border-strong rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1.5">
                                End date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full h-9 px-3 bg-surface border border-border-strong rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="button"
                                onClick={handleRun}
                                disabled={selectedIds.length < 1 || isFetching}
                                className="w-full"
                            >
                                <GitCompareArrows size={14} />
                                {isFetching ? 'Running…' : 'Run comparison'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Empty state */}
            {!submitted && (
                <Card>
                    <EmptyState
                        icon={<GitCompareArrows size={20} />}
                        title="Select branches to compare"
                        description="Pick at least one branch above and click Run comparison."
                    />
                </Card>
            )}

            {submitted && isLoading && (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            )}

            {comparison && !isLoading && (
                <>
                    {/* Metric tabs (mobile only — desktop has it in the header) */}
                    {!embedded && (
                        <div className="flex md:hidden mb-4">
                            <Segmented
                                value={metric}
                                options={metricOptions}
                                onChange={setMetric}
                            />
                        </div>
                    )}

                    {/* Selected branches summary chip row */}
                    {selectedBranchNames.length > 0 && (
                        <div className="text-xs text-text-2 mb-4">
                            Comparing{' '}
                            <span className="text-text-1 font-medium">
                                {selectedBranchNames.join(', ')}
                            </span>
                        </div>
                    )}

                    {/* Per-branch metric cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                        {comparison.branches.map((b) => (
                            <MetricCard
                                key={b.branchId}
                                entry={b}
                                metric={metric}
                            />
                        ))}
                    </div>

                    {/* Revenue vs Expenses chart */}
                    <Card className="p-5 mb-6">
                        <div className="mb-4">
                            <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                                Revenue vs expenses
                            </h3>
                            <p className="text-xs text-text-2 mt-0.5">
                                Compared across {comparison.branches.length} branch
                                {comparison.branches.length === 1 ? '' : 'es'}
                            </p>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--text-3)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-3)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 8,
                                            color: 'var(--text-1)',
                                            fontSize: 12,
                                        }}
                                        formatter={(value: number | undefined) =>
                                            formatCurrency(value || 0)
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} />
                                    <Bar
                                        dataKey="Revenue"
                                        fill="var(--primary)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="Expenses"
                                        fill="var(--brand-400)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

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

function MetricCard({
    entry,
    metric,
}: {
    entry: IBranchComparisonEntry;
    metric: MetricKey;
}) {
    const main = (() => {
        switch (metric) {
            case 'revenue':
                return {
                    label: 'Total revenue',
                    value: formatCurrency(entry.revenue),
                };
            case 'transactions':
                return {
                    label: 'Transactions',
                    value: entry.transactionCount.toLocaleString(),
                };
            case 'aov':
                return {
                    label: 'Avg transaction value',
                    value: formatCurrency(entry.avgTransactionValue),
                };
        }
    })();

    return (
        <Card className="p-5">
            <p className="text-[13px] font-semibold text-text-1 truncate mb-3">
                {entry.branchName}
            </p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold">
                {main.label}
            </p>
            <p className="mono text-2xl font-bold text-text-1 tracking-tight mt-1">
                {main.value}
            </p>
            <div className="mt-4 pt-3 border-t border-border space-y-2 text-[12px]">
                <Row
                    label="Expenses"
                    value={formatCurrency(entry.expenses)}
                />
                <Row
                    label="Expense ratio"
                    value={formatPercent(entry.expenseRatio)}
                />
                <Row
                    label="Staff"
                    value={entry.staffCount.toLocaleString()}
                />
                <Row
                    label="Revenue / staff"
                    value={formatCurrency(entry.revenuePerStaff)}
                />
            </div>
        </Card>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-text-3">{label}</span>
            <span className="mono text-text-1 font-medium">{value}</span>
        </div>
    );
}

function TopProductsTable({ entry }: { entry: IBranchComparisonEntry }) {
    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
                <p className="text-[13px] font-semibold text-text-1">
                    Top products — {entry.branchName}
                </p>
            </div>
            {entry.topProducts.length === 0 ? (
                <EmptyState title="No sales in this range" />
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                            <th className="px-5 py-2.5 font-semibold">Product</th>
                            <th className="px-5 py-2.5 font-semibold text-right">
                                Qty
                            </th>
                            <th className="px-5 py-2.5 font-semibold text-right">
                                Revenue
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {entry.topProducts.map((p) => (
                            <tr
                                key={p.productId}
                                className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                            >
                                <td className="px-5 py-3 text-[13px] text-text-1 font-medium">
                                    {p.productName}
                                </td>
                                <td className="px-5 py-3 mono text-[13px] text-text-2 text-right">
                                    {p.quantity.toLocaleString()}
                                </td>
                                <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                    {formatCurrency(p.revenue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Card>
    );
}
