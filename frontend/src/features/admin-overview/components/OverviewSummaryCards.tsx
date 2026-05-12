import { formatCurrency } from '@/lib/utils';
import type { IOverviewResponse } from '@/types';

interface OverviewSummaryCardsProps {
    summary: IOverviewResponse['summary'];
}

export function OverviewSummaryCards({ summary }: OverviewSummaryCardsProps) {
    const cards = [
        {
            title: "Today's Revenue",
            value: formatCurrency(summary.totalRevenueToday),
            sub: `${summary.totalTransactionsToday} transactions`,
        },
        {
            title: 'Total Transactions',
            value: String(summary.totalTransactionsToday),
            sub: 'Today',
        },
        {
            title: 'Branches',
            value: String(summary.activeBranches + summary.inactiveBranches),
            sub: `${summary.activeBranches} active, ${summary.inactiveBranches} inactive`,
        },
        {
            title: 'Total Staff',
            value: String(summary.totalStaff),
            sub: 'Across all branches',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="bg-surface border border-border rounded-md p-5"
                >
                    <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                        {card.title}
                    </p>
                    <p className="text-2xl font-bold text-text-1 tracking-tight">
                        {card.value}
                    </p>
                    <p className="text-xs text-text-3 mt-1">{card.sub}</p>
                </div>
            ))}
        </div>
    );
}
