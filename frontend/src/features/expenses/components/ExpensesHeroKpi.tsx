import Card from '@/components/ui/Card';
import Spark from '@/components/ui/Spark';
import { formatCurrencyWhole, monthLabel } from '../lib/format';

interface ExpensesHeroKpiProps {
    thisMonthTotal: number;
    monthOverMonthDelta: number | null;
    last14DaysTotals: number[];
}

export function ExpensesHeroKpi({
    thisMonthTotal,
    monthOverMonthDelta,
    last14DaysTotals,
}: ExpensesHeroKpiProps) {
    const now = new Date();
    const deltaIsGood =
        monthOverMonthDelta !== null && monthOverMonthDelta < 0;
    const deltaColor =
        monthOverMonthDelta === null
            ? 'var(--text-3)'
            : deltaIsGood
              ? 'var(--accent)'
              : 'var(--danger)';

    return (
        <Card className="p-6 border-l-2 border-l-accent mb-3">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                        Total · {monthLabel(now)}
                    </p>
                    <p className="mono text-4xl font-semibold text-text-1 tracking-tight leading-none">
                        {formatCurrencyWhole(thisMonthTotal)}
                    </p>
                </div>
                <div className="flex items-end gap-3">
                    <div className="w-32">
                        <Spark
                            data={last14DaysTotals}
                            color={deltaColor}
                            h={36}
                            fill
                        />
                        <p className="text-[10px] text-text-3 text-right mt-1 uppercase tracking-widest">
                            Last 14 days
                        </p>
                    </div>
                    {monthOverMonthDelta !== null && (
                        <div
                            className={`inline-flex items-center h-7 px-2.5 rounded-md text-xs font-semibold ${
                                deltaIsGood
                                    ? 'bg-accent-soft text-accent-text'
                                    : 'bg-danger-soft text-danger'
                            }`}
                        >
                            {monthOverMonthDelta > 0 ? '+' : ''}
                            {monthOverMonthDelta.toFixed(1)}%
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
