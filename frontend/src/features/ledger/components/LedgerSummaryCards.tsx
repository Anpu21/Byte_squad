import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import type { ILedgerSummary } from '@/types';

interface LedgerSummaryCardsProps {
    summary: ILedgerSummary | null;
}

interface KpiProps {
    label: string;
    value: React.ReactNode;
    tone?: 'default' | 'accent' | 'danger';
}

function Kpi({ label, value, tone = 'default' }: KpiProps) {
    const toneClass =
        tone === 'accent'
            ? 'text-accent-text'
            : tone === 'danger'
              ? 'text-danger'
              : 'text-text-1';
    return (
        <Card className="p-5">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                {label}
            </p>
            <p className={`mono text-xl font-semibold ${toneClass}`}>{value}</p>
        </Card>
    );
}

export function LedgerSummaryCards({ summary }: LedgerSummaryCardsProps) {
    if (!summary) return null;
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi
                label="Total credits"
                value={formatCurrency(summary.totalCredits)}
                tone="accent"
            />
            <Kpi
                label="Total debits"
                value={formatCurrency(summary.totalDebits)}
            />
            <Kpi
                label="Net balance"
                value={formatCurrency(summary.netBalance)}
                tone={summary.netBalance >= 0 ? 'accent' : 'danger'}
            />
            <Kpi label="Total entries" value={summary.entryCount} />
        </div>
    );
}
