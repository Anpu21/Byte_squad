import Card from '@/components/ui/Card';
import type { IProfitLossData } from '@/types';
import { formatCurrencyWhole, formatPercent } from '../lib/format';

interface ProfitLossSummaryKpisProps {
    data: IProfitLossData;
}

export function ProfitLossSummaryKpis({ data }: ProfitLossSummaryKpisProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                    Net revenue
                </p>
                <p className="mono text-xl font-semibold text-text-1">
                    {formatCurrencyWhole(data.revenue.netRevenue)}
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
                    {formatCurrencyWhole(data.grossProfit)}
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
                    {formatCurrencyWhole(data.expenses.total)}
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
                    {formatCurrencyWhole(data.netProfit)}
                </p>
                <p className="text-xs text-text-3 mt-1">
                    {formatPercent(data.netMargin)} margin
                </p>
            </Card>
        </div>
    );
}
