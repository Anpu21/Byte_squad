import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import BarChart from '@/components/charts/BarChart';
import { formatRevenue } from '@/features/admin-dashboard/lib/format';

interface CashierSalesChartProps {
    chartData: { name: string; value: number }[];
}

export function CashierSalesChart({ chartData }: CashierSalesChartProps) {
    return (
        <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-text-1 mb-3">
                Last 7 days
            </h3>
            {chartData.length > 0 ? (
                <BarChart
                    data={chartData}
                    height={260}
                    color="var(--primary)"
                    formatValue={(v) => formatRevenue(v)}
                />
            ) : (
                <EmptyState title="No sales data yet" />
            )}
        </Card>
    );
}
