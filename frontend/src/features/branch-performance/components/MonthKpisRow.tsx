import Card from '@/components/ui/Card';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

interface MonthKpisRowProps {
    month: IMyBranchPerformance['month'];
}

export function MonthKpisRow({ month }: MonthKpisRowProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                    Month revenue
                </p>
                <p className="mono text-xl font-semibold text-text-1">
                    {formatCurrencyWhole(month.revenue)}
                </p>
                <p className="text-xs text-text-3 mt-0.5">
                    {month.transactions} transactions
                </p>
            </Card>
            <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                    Month expenses
                </p>
                <p className="mono text-xl font-semibold text-text-1">
                    {formatCurrencyWhole(month.expenses)}
                </p>
                <p className="text-xs text-text-3 mt-0.5">This month</p>
            </Card>
            <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                    Net profit
                </p>
                <p
                    className={`mono text-xl font-semibold ${
                        month.netProfit >= 0
                            ? 'text-accent-text'
                            : 'text-danger'
                    }`}
                >
                    {formatCurrencyWhole(month.netProfit)}
                </p>
                <p className="text-xs text-text-3 mt-0.5">
                    {month.netProfit >= 0 ? 'Profitable' : 'Loss'}
                </p>
            </Card>
        </div>
    );
}
