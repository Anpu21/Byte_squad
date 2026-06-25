import Card from '@/components/ui/Card';
import { EmptyState } from '@/components/ui';
import DonutChart, { type DonutSlice } from '@/components/charts/DonutChart';
import { CHART_COLORS } from '@/components/charts/chart-palette';
import type { IProfitLossData } from '@/types';
import { formatRevenue, formatCompact } from '../lib/format';

interface ExpenseBreakdownCardProps {
    profitLoss: IProfitLossData | undefined;
}

export function ExpenseBreakdownCard({
    profitLoss,
}: ExpenseBreakdownCardProps) {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Expense Breakdown
                </h3>
            </div>

            {!profitLoss ? (
                <EmptyState title="Expense data unavailable" />
            ) : (
                <DonutChart
                    data={profitLoss.expenses.byCategory.map<DonutSlice>(
                        (c, i) => ({
                            name: c.category,
                            value: c.amount,
                            color: CHART_COLORS[i % CHART_COLORS.length],
                        }),
                    )}
                    formatValue={formatRevenue}
                    centerValue={formatCompact(profitLoss.expenses.total)}
                    centerLabel="Total"
                />
            )}
        </Card>
    );
}
