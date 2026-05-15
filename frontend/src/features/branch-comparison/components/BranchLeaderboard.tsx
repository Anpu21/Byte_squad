import { TrendingDown, Trophy } from 'lucide-react';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import type { LeaderboardRow } from '../hooks/useBranchComparisonPage';
import {
    formatCurrencyWhole,
    formatPercent,
    type MetricKey,
} from '../lib/format';

const METRIC_LABEL: Record<MetricKey, string> = {
    revenue: 'Total revenue',
    transactions: 'Transactions',
    aov: 'Avg transaction value',
};

interface BranchLeaderboardProps {
    rows: LeaderboardRow[];
    metric: MetricKey;
}

export function BranchLeaderboard({ rows, metric }: BranchLeaderboardProps) {
    const mainLabel = METRIC_LABEL[metric];
    return (
        <Card className="mb-6 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-text-3" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-2">
                        Leaderboard · {mainLabel}
                    </p>
                </div>
                <p className="text-[11px] text-text-3">
                    {rows.length} {rows.length === 1 ? 'branch' : 'branches'}
                </p>
            </div>
            <ul role="list" className="divide-y divide-border">
                {rows.map((r) => (
                    <li
                        key={r.entry.branchId}
                        className={`relative px-5 py-4 transition-colors hover:bg-surface-2/40 ${
                            r.isLeader
                                ? 'bg-primary-soft/30 border-l-2 border-primary'
                                : ''
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <span
                                className={`flex-shrink-0 w-7 h-7 rounded-full text-[12px] font-bold flex items-center justify-center tabular-nums ${
                                    r.isLeader
                                        ? 'bg-primary text-text-inv'
                                        : 'bg-surface-2 text-text-2'
                                }`}
                                aria-label={`Rank ${r.rank}`}
                            >
                                {r.rank}
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-semibold text-text-1 truncate">
                                        {r.entry.branchName}
                                    </p>
                                    {r.isLeader && (
                                        <Pill tone="primary" dot={false}>
                                            Leader
                                        </Pill>
                                    )}
                                </div>
                                <div
                                    className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden"
                                    aria-hidden="true"
                                >
                                    <div
                                        className={`h-full rounded-full transition-[width] duration-500 ${
                                            r.isLeader
                                                ? 'bg-primary'
                                                : 'bg-primary/55'
                                        }`}
                                        style={{
                                            width: `${Math.max(2, r.shareOfLeader * 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-[11px] text-text-3 leading-relaxed">
                                    Expenses{' '}
                                    <span className="text-text-2 font-medium mono">
                                        {formatCurrencyWhole(r.entry.expenses)}
                                    </span>{' '}
                                    ·{' '}
                                    <span className="text-text-2 font-medium">
                                        {formatPercent(r.entry.expenseRatio)}
                                    </span>{' '}
                                    expense ratio · Staff{' '}
                                    <span className="text-text-2 font-medium tabular-nums">
                                        {r.entry.staffCount.toLocaleString()}
                                    </span>{' '}
                                    · Rev / staff{' '}
                                    <span className="text-text-2 font-medium mono">
                                        {formatCurrencyWhole(
                                            r.entry.revenuePerStaff,
                                        )}
                                    </span>
                                </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <p className="mono text-xl font-bold text-text-1 tracking-tight leading-none">
                                    {r.formattedValue}
                                </p>
                                {r.isLeader ? (
                                    <p className="mt-1 text-[11px] text-text-3 uppercase tracking-[0.08em] font-semibold">
                                        Top performer
                                    </p>
                                ) : (
                                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-danger font-semibold tabular-nums">
                                        <TrendingDown size={11} />
                                        {(r.deltaPct * 100).toFixed(1)}% vs
                                        leader
                                    </p>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
}
