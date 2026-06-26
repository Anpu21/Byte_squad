import Card from '@/components/ui/Card';
import DonutChart, { type DonutSlice } from '@/components/charts/DonutChart';
import type { IRevenueByBranch } from '@/types';
import { formatRevenue, formatCompact } from '../lib/format';

interface RevenueByBranchCardProps {
    revenueByBranch: IRevenueByBranch[];
    branchColors: Record<string, string>;
}

export function RevenueByBranchCard({
    revenueByBranch,
    branchColors,
}: RevenueByBranchCardProps) {
    const slices: DonutSlice[] = revenueByBranch.map((b) => ({
        name: b.branchName,
        value: b.total,
        color: branchColors[b.branchId] ?? 'var(--brand-400)',
    }));

    const total = revenueByBranch.reduce((sum, b) => sum + b.total, 0);

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Revenue by Branch
                </h3>
            </div>
            <DonutChart
                data={slices}
                formatValue={formatRevenue}
                centerValue={formatCompact(total)}
                centerLabel="Total"
            />
        </Card>
    );
}
