import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { branchesService } from '@/services/branches.service';
import type { IMyBranchPerformance } from '@/types';
import { BranchHeaderCard } from '@/features/branch-performance/components/BranchHeaderCard';
import { BranchKpiStrip } from '@/features/branch-performance/components/BranchKpiStrip';
import { LowStockAlerts } from '@/features/branch-performance/components/LowStockAlerts';
import { StaffByRoleCard } from '@/features/branch-performance/components/StaffByRoleCard';
import { BranchSalesChart } from '@/features/branch-performance/components/BranchSalesChart';
import { MonthKpisRow } from '@/features/branch-performance/components/MonthKpisRow';
import { TopProductsTable } from '@/features/branch-performance/components/TopProductsTable';
import { RecentTransactionsTable } from '@/features/branch-performance/components/RecentTransactionsTable';
import { formatDateShort } from '@/features/branch-performance/lib/format';

const REFETCH_INTERVAL_MS = 30000;

export function BranchPerformancePage() {
    const { data, isLoading, isError, error, refetch } =
        useQuery<IMyBranchPerformance>({
            queryKey: queryKeys.branch.myPerformance(),
            queryFn: branchesService.getMyPerformance,
            refetchInterval: REFETCH_INTERVAL_MS,
        });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-surface border border-danger/40 rounded-md p-6">
                <p className="text-danger font-semibold mb-2">
                    Failed to load branch performance
                </p>
                <p className="text-sm text-text-2 mb-4">
                    {error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'}
                </p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-primary text-text-inv rounded-md text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const chartData = data.week.dailyBreakdown.map((d) => ({
        label: formatDateShort(d.date),
        sales: d.sales,
    }));
    const dailySalesSpark = chartData.map((c) => c.sales);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BranchHeaderCard branch={data.branch} admin={data.admin} />
            <BranchKpiStrip
                today={data.today}
                week={data.week}
                inventory={data.inventory}
                dailySalesSpark={dailySalesSpark}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <LowStockAlerts
                    lowStockList={data.lowStockList}
                    lowStockItems={data.inventory.lowStockItems}
                />
                <StaffByRoleCard staff={data.staff} />
            </div>
            <BranchSalesChart
                weekTotal={data.week.sales}
                chartData={chartData}
            />
            <MonthKpisRow month={data.month} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TopProductsTable topProducts={data.topProducts} />
                <RecentTransactionsTable
                    recentTransactions={data.recentTransactions}
                />
            </div>
        </div>
    );
}
