import { useState, useEffect } from 'react';
import { accountingService } from '@/services/accounting.service';
import type { IProfitLossData } from '@/services/accounting.service';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import EmptyState from '@/components/ui/EmptyState';

type PeriodKey = 'week' | 'month' | 'quarter' | 'ytd' | 'custom';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatPercent(value: number) {
    return `${value.toFixed(1)}%`;
}

function toIso(d: Date) {
    return d.toISOString().split('T')[0];
}

function formatDateRangeLabel(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const sameYear = s.getFullYear() === e.getFullYear();
    const sopts: Intl.DateTimeFormatOptions = sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    return `${s.toLocaleDateString('en-US', sopts)} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function rangeForPeriod(period: PeriodKey): { start: string; end: string } {
    const now = new Date();
    const today = toIso(now);
    if (period === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { start: toIso(start), end: today };
    }
    if (period === 'month') {
        return {
            start: toIso(new Date(now.getFullYear(), now.getMonth(), 1)),
            end: today,
        };
    }
    if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        return {
            start: toIso(new Date(now.getFullYear(), q * 3, 1)),
            end: today,
        };
    }
    if (period === 'ytd') {
        return {
            start: toIso(new Date(now.getFullYear(), 0, 1)),
            end: today,
        };
    }
    return { start: today, end: today };
}

export default function ProfitLossPage() {
    const [data, setData] = useState<IProfitLossData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initial = rangeForPeriod('month');
    const [period, setPeriod] = useState<PeriodKey>('month');
    const [startDate, setStartDate] = useState(initial.start);
    const [endDate, setEndDate] = useState(initial.end);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setIsLoading(true);
                const result = await accountingService.getProfitLoss(
                    startDate,
                    endDate,
                );
                if (!cancelled) {
                    setData(result);
                    setError(null);
                }
            } catch {
                if (!cancelled)
                    setError('Failed to load profit & loss data');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [startDate, endDate]);

    const handlePeriodChange = (next: PeriodKey) => {
        setPeriod(next);
        if (next !== 'custom') {
            const r = rangeForPeriod(next);
            setStartDate(r.start);
            setEndDate(r.end);
        }
    };

    const periodOptions: { label: string; value: PeriodKey }[] = [
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
        { label: 'Quarter', value: 'quarter' },
        { label: 'YTD', value: 'ytd' },
    ];

    const inputClass =
        'h-9 px-3 bg-surface border border-border-strong text-text-1 text-sm rounded-md outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Profit &amp; Loss
                    </h1>
                    <p className="text-xs text-text-2 mt-1">
                        {formatDateRangeLabel(startDate, endDate)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Segmented
                        value={period === 'custom' ? 'month' : period}
                        options={periodOptions}
                        onChange={handlePeriodChange}
                    />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setPeriod('custom');
                        }}
                        className={inputClass}
                    />
                    <span className="text-text-3 text-sm">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setPeriod('custom');
                        }}
                        className={inputClass}
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="h-5 w-40 bg-surface-2 rounded animate-pulse mb-4" />
                            <div className="space-y-3">
                                <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
                                <div className="h-4 w-3/4 bg-surface-2 rounded animate-pulse" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card className="p-5">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                                Net revenue
                            </p>
                            <p className="mono text-xl font-semibold text-text-1">
                                {formatCurrency(data.revenue.netRevenue)}
                            </p>
                            <p className="text-xs text-text-3 mt-1">
                                {data.revenue.totalTransactions} transactions
                            </p>
                        </Card>
                        <Card className="p-5">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                                Gross profit
                            </p>
                            <p className="mono text-xl font-semibold text-text-1">
                                {formatCurrency(data.grossProfit)}
                            </p>
                            <p className="text-xs text-text-3 mt-1">
                                {formatPercent(data.grossMargin)} margin
                            </p>
                        </Card>
                        <Card className="p-5">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                                Total expenses
                            </p>
                            <p className="mono text-xl font-semibold text-text-1">
                                {formatCurrency(data.expenses.total)}
                            </p>
                            <p className="text-xs text-text-3 mt-1">
                                {data.expenses.byCategory.length} categories
                            </p>
                        </Card>
                        <Card className="p-5 border-2 border-primary/30">
                            <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                                Net profit
                            </p>
                            <p
                                className={`mono text-xl font-semibold ${
                                    data.netProfit >= 0
                                        ? 'text-accent-text'
                                        : 'text-danger'
                                }`}
                            >
                                {formatCurrency(data.netProfit)}
                            </p>
                            <p className="text-xs text-text-3 mt-1">
                                {formatPercent(data.netMargin)} margin
                            </p>
                        </Card>
                    </div>

                    {/* Statement */}
                    <Card className="overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-surface-2">
                            <h2 className="text-[15px] font-semibold text-text-1 tracking-tight">
                                Statement
                            </h2>
                            <p className="text-xs text-text-2 mt-0.5">
                                Income statement for the selected period
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            <Section title="Revenue">
                                <Row
                                    label="Total sales"
                                    value={formatCurrency(
                                        data.revenue.totalSales,
                                    )}
                                />
                                <Row
                                    label="Discounts given"
                                    value={`−${formatCurrency(data.revenue.totalDiscounts)}`}
                                    dim
                                />
                                <Row
                                    label="Tax collected"
                                    value={formatCurrency(
                                        data.revenue.totalTax,
                                    )}
                                    dim
                                />
                                <Row
                                    label="Net revenue"
                                    value={formatCurrency(
                                        data.revenue.netRevenue,
                                    )}
                                    bold
                                />
                            </Section>

                            <Section title="Cost of goods sold">
                                <Row
                                    label={`Product costs · ${data.costOfGoodsSold.itemsSold} items sold`}
                                    value={formatCurrency(
                                        data.costOfGoodsSold.totalCOGS,
                                    )}
                                />
                                <Row
                                    label="Total COGS"
                                    value={`−${formatCurrency(data.costOfGoodsSold.totalCOGS)}`}
                                    bold
                                />
                            </Section>

                            <SubtotalRow
                                label="Gross profit"
                                value={formatCurrency(data.grossProfit)}
                                trailing={`(${formatPercent(data.grossMargin)})`}
                            />

                            <Section title="Operating expenses">
                                {data.expenses.byCategory.length > 0 ? (
                                    data.expenses.byCategory.map((cat) => (
                                        <Row
                                            key={cat.category}
                                            label={cat.category}
                                            value={`−${formatCurrency(cat.amount)}`}
                                        />
                                    ))
                                ) : (
                                    <Row
                                        label="No expenses recorded"
                                        value="—"
                                        dim
                                    />
                                )}
                                <Row
                                    label="Total operating expenses"
                                    value={`−${formatCurrency(data.expenses.total)}`}
                                    bold
                                />
                            </Section>

                            <SubtotalRow
                                label="Net profit"
                                value={formatCurrency(data.netProfit)}
                                trailing={`(${formatPercent(data.netMargin)})`}
                                emphasize
                                positive={data.netProfit >= 0}
                            />
                        </div>
                    </Card>
                </>
            ) : (
                <Card>
                    <EmptyState
                        title="No data yet"
                        description="Once sales and expenses are recorded for this period they'll show up here."
                    />
                </Card>
            )}
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="py-1">
            <div className="px-5 py-2.5">
                <h3 className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

function Row({
    label,
    value,
    bold,
    dim,
}: {
    label: string;
    value: string;
    bold?: boolean;
    dim?: boolean;
}) {
    return (
        <div className="px-5 py-2 flex items-center justify-between">
            <span
                className={`text-[13px] ${
                    bold
                        ? 'font-semibold text-text-1'
                        : dim
                          ? 'text-text-3'
                          : 'text-text-2'
                }`}
            >
                {label}
            </span>
            <span
                className={`mono text-[13px] ${
                    bold
                        ? 'font-semibold text-text-1'
                        : dim
                          ? 'text-text-3'
                          : 'text-text-1'
                }`}
            >
                {value}
            </span>
        </div>
    );
}

function SubtotalRow({
    label,
    value,
    trailing,
    emphasize,
    positive = true,
}: {
    label: string;
    value: string;
    trailing?: string;
    emphasize?: boolean;
    positive?: boolean;
}) {
    return (
        <div
            className={`px-5 py-3.5 flex items-center justify-between ${
                emphasize ? 'bg-primary-soft' : 'bg-surface-2'
            }`}
        >
            <span
                className={`${
                    emphasize ? 'text-base' : 'text-[14px]'
                } font-semibold text-text-1`}
            >
                {label}
            </span>
            <div className="text-right">
                <span
                    className={`mono ${
                        emphasize ? 'text-base' : 'text-[14px]'
                    } font-bold ${
                        emphasize && !positive ? 'text-danger' : 'text-text-1'
                    }`}
                >
                    {value}
                </span>
                {trailing && (
                    <span className="text-[11px] text-text-3 ml-2">
                        {trailing}
                    </span>
                )}
            </div>
        </div>
    );
}
