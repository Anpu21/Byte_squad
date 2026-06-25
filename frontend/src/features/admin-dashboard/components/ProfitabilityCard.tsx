import Card from '@/components/ui/Card';
import { EmptyState } from '@/components/ui';
import BarChart from '@/components/charts/BarChart';
import type { IProfitLossData } from '@/types';
import { formatRevenue, formatCompact } from '../lib/format';

interface ProfitabilityCardProps {
    profitLoss: IProfitLossData | undefined;
}

export function ProfitabilityCard({ profitLoss }: ProfitabilityCardProps) {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Profitability Analysis
                </h3>
            </div>

            {!profitLoss ? (
                <EmptyState title="Profit data unavailable" />
            ) : (
                <>
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <div className="text-[11px] text-text-3 mb-1">
                                Gross Profit
                            </div>
                            <div className="mono text-[15px] font-bold text-text-1">
                                {formatRevenue(profitLoss.grossProfit)}
                            </div>
                            <div className="mono text-[10.5px] text-text-3 mt-0.5">
                                Margin {profitLoss.grossMargin.toFixed(1)}%
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="text-[11px] text-text-3 mb-1">
                                Operating Expenses
                            </div>
                            <div className="mono text-[15px] font-bold text-text-1">
                                {formatRevenue(profitLoss.expenses.total)}
                            </div>
                            <div className="mono text-[10.5px] text-text-3 mt-0.5">
                                This month
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="text-[11px] text-text-3 mb-1">
                                Net Profit
                            </div>
                            <div className="mono text-[15px] font-bold text-text-1">
                                {formatRevenue(profitLoss.netProfit)}
                            </div>
                            <div className="mono text-[10.5px] text-text-3 mt-0.5">
                                Margin {profitLoss.netMargin.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <BarChart
                        data={[
                            {
                                name: 'Revenue',
                                value: profitLoss.revenue.netRevenue,
                            },
                            { name: 'Gross', value: profitLoss.grossProfit },
                            { name: 'Net', value: profitLoss.netProfit },
                            {
                                name: 'Expenses',
                                value: profitLoss.expenses.total,
                            },
                        ]}
                        height={180}
                        color="var(--primary)"
                        formatValue={formatCompact}
                    />
                </>
            )}
        </Card>
    );
}
