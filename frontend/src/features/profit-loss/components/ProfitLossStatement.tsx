import Card from '@/components/ui/Card';
import type { IProfitLossData } from '@/types';
import { formatCurrencyWhole, formatPercent } from '../lib/format';
import { StatementSection } from './StatementSection';
import { StatementRow } from './StatementRow';
import { StatementSubtotalRow } from './StatementSubtotalRow';

interface ProfitLossStatementProps {
    data: IProfitLossData;
}

export function ProfitLossStatement({ data }: ProfitLossStatementProps) {
    return (
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
                <StatementSection title="Revenue">
                    <StatementRow
                        label="Total sales"
                        value={formatCurrencyWhole(data.revenue.totalSales)}
                    />
                    <StatementRow
                        label="Discounts given"
                        value={`−${formatCurrencyWhole(data.revenue.totalDiscounts)}`}
                        dim
                    />
                    <StatementRow
                        label="Tax collected"
                        value={formatCurrencyWhole(data.revenue.totalTax)}
                        dim
                    />
                    <StatementRow
                        label="Net revenue"
                        value={formatCurrencyWhole(data.revenue.netRevenue)}
                        bold
                    />
                </StatementSection>

                <StatementSection title="Cost of goods sold">
                    <StatementRow
                        label={`Product costs · ${data.costOfGoodsSold.itemsSold} items sold`}
                        value={formatCurrencyWhole(
                            data.costOfGoodsSold.totalCOGS,
                        )}
                    />
                    <StatementRow
                        label="Total COGS"
                        value={`−${formatCurrencyWhole(data.costOfGoodsSold.totalCOGS)}`}
                        bold
                    />
                </StatementSection>

                <StatementSubtotalRow
                    label="Gross profit"
                    value={formatCurrencyWhole(data.grossProfit)}
                    trailing={`(${formatPercent(data.grossMargin)})`}
                />

                <StatementSection title="Operating expenses">
                    {data.expenses.byCategory.length > 0 ? (
                        data.expenses.byCategory.map((cat) => (
                            <StatementRow
                                key={cat.category}
                                label={cat.category}
                                value={`−${formatCurrencyWhole(cat.amount)}`}
                            />
                        ))
                    ) : (
                        <StatementRow
                            label="No expenses recorded"
                            value="—"
                            dim
                        />
                    )}
                    <StatementRow
                        label="Total operating expenses"
                        value={`−${formatCurrencyWhole(data.expenses.total)}`}
                        bold
                    />
                </StatementSection>

                <StatementSubtotalRow
                    label="Net profit"
                    value={formatCurrencyWhole(data.netProfit)}
                    trailing={`(${formatPercent(data.netMargin)})`}
                    emphasize
                    positive={data.netProfit >= 0}
                />
            </div>
        </Card>
    );
}
