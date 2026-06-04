import Card from '@/components/ui/Card';
import type { IBranchAnalyticsComparisonEntry } from '@/types';
import {
    formatCurrencyWhole,
    formatNumber,
    formatPercent,
    type MetricKey,
} from '../lib/format';

interface BranchMetricCardProps {
    entry: IBranchAnalyticsComparisonEntry;
    metric: MetricKey;
}

function mainStat(entry: IBranchAnalyticsComparisonEntry, metric: MetricKey) {
    switch (metric) {
        case 'revenue':
            return {
                label: 'Total revenue',
                value: formatCurrencyWhole(entry.financial.revenue),
            };
        case 'grossProfit':
            return {
                label: 'Gross profit',
                value: formatCurrencyWhole(entry.financial.grossProfit),
            };
        case 'transactions':
            return {
                label: 'Transactions',
                value: entry.sales.transactionCount.toLocaleString(),
            };
        case 'aov':
            return {
                label: 'Avg transaction value',
                value: formatCurrencyWhole(entry.sales.avgTransactionValue),
            };
        case 'activeProducts':
            return {
                label: 'Active products',
                value: formatNumber(entry.inventory.activeProducts),
            };
        case 'loyaltyMembers':
            return {
                label: 'Loyalty members',
                value: formatNumber(entry.loyalty.activeMembers),
            };
    }
}

interface RowProps {
    label: string;
    value: string;
}

function Row({ label, value }: RowProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-text-3">{label}</span>
            <span className="mono text-text-1 font-medium">{value}</span>
        </div>
    );
}

export function BranchMetricCard({ entry, metric }: BranchMetricCardProps) {
    const main = mainStat(entry, metric);
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
                    value={formatCurrencyWhole(entry.financial.expenses)}
                />
                <Row
                    label="Expense ratio"
                    value={formatPercent(entry.financial.expenseRatio)}
                />
                <Row
                    label="Staff"
                    value={entry.staff.staffCount.toLocaleString()}
                />
                <Row
                    label="Revenue / staff"
                    value={formatCurrencyWhole(entry.staff.revenuePerStaff)}
                />
            </div>
        </Card>
    );
}
