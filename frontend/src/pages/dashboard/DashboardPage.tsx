import { OverviewPage } from '@/pages/admin/OverviewPage';
import { useDashboardPage } from '@/features/admin-dashboard/hooks/useDashboardPage';
import { DashboardHeader } from '@/features/admin-dashboard/components/DashboardHeader';
import { DashboardKpis } from '@/features/admin-dashboard/components/DashboardKpis';
import { SalesOverviewCard } from '@/features/admin-dashboard/components/SalesOverviewCard';
import { TopProductsCard } from '@/features/admin-dashboard/components/TopProductsCard';
import { RecentActivityCard } from '@/features/admin-dashboard/components/RecentActivityCard';

export function DashboardPage() {
    const p = useDashboardPage();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardHeader
                todayLabel={p.todayLabel}
                greeting={p.greeting}
                firstName={p.user?.firstName}
            />

            <DashboardKpis
                todayRevenue={p.todayRevenue}
                todayCount={p.todayCount}
                monthTransactionCount={p.data?.month.transactionCount ?? 0}
                avgOrderValue={p.avgOrderValue}
                activeProducts={p.data?.stats.activeProducts ?? 0}
                lowStockCount={p.lowStockCount}
                sparkline={p.sparkline}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <SalesOverviewCard chartData={p.chartData} />
                <TopProductsCard products={p.data?.topProducts ?? []} />
            </div>

            {p.isAdmin && (
                <div className="mb-4">
                    <OverviewPage embedded />
                </div>
            )}

            <RecentActivityCard
                transactions={p.data?.recentTransactions ?? []}
            />
        </div>
    );
}
