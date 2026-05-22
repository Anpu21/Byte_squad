import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useProfitLossPage } from '@/features/profit-loss/hooks/useProfitLossPage';
import { ProfitLossHeader } from '@/features/profit-loss/components/ProfitLossHeader';
import { ProfitLossSummaryKpis } from '@/features/profit-loss/components/ProfitLossSummaryKpis';
import { ProfitLossStatement } from '@/features/profit-loss/components/ProfitLossStatement';
import { ProfitLossSkeleton } from '@/features/profit-loss/components/ProfitLossSkeleton';

export function ProfitLossPage() {
    const p = useProfitLossPage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProfitLossHeader
                startDate={p.startDate}
                endDate={p.endDate}
                period={p.period}
                onPeriodChange={p.handlePeriodChange}
                onStartChange={(v) => {
                    p.setStartDate(v);
                    p.setPeriod('custom');
                }}
                onEndChange={(v) => {
                    p.setEndDate(v);
                    p.setPeriod('custom');
                }}
            />

            {p.error && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {p.error}
                </div>
            )}

            {p.isLoading ? (
                <ProfitLossSkeleton />
            ) : p.data ? (
                <>
                    <ProfitLossSummaryKpis data={p.data} />
                    <ProfitLossStatement data={p.data} />
                </>
            ) : (
                <Card>
                    <EmptyState
                        title="No data yet"
                        description="Once sales and expenses are recorded for this period they'll show up here."
                    />
                </Card>
            )}
        </div>
    );
}
