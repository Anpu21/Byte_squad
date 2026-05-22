import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import BarChart from '@/components/charts/BarChart';
import { formatRevenue } from '../lib/format';

interface SalesOverviewCardProps {
    chartData: { name: string; value: number }[];
}

export function SalesOverviewCard({ chartData }: SalesOverviewCardProps) {
    return (
        <Card className="lg:col-span-2 p-5">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Sales overview
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Last 7 days · all branches
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-2">
                    <span className="inline-flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: 'var(--primary)' }}
                        />
                        Revenue
                    </span>
                </div>
            </div>
            {chartData.length > 0 ? (
                <BarChart
                    data={chartData}
                    height={240}
                    color="var(--primary)"
                    formatValue={(v) => formatRevenue(v)}
                />
            ) : (
                <EmptyState
                    title="No sales data yet"
                    description="Daily totals will appear here once transactions begin."
                />
            )}
        </Card>
    );
}
