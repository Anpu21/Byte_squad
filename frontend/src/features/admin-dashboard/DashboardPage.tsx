import { useDashboardPage } from '@/features/admin-dashboard/hooks/useDashboardPage';
import { DashboardHeader } from '@/features/admin-dashboard/components/DashboardHeader';
import { KpiRow } from '@/features/admin-dashboard/components/KpiRow';
import { RevenueTrendCard } from '@/features/admin-dashboard/components/RevenueTrendCard';
import { RevenueByBranchCard } from '@/features/admin-dashboard/components/RevenueByBranchCard';
import { TopProductsCard } from '@/features/admin-dashboard/components/TopProductsCard';
import { PaymentMethodsCard } from '@/features/admin-dashboard/components/PaymentMethodsCard';
import { ExpenseBreakdownCard } from '@/features/admin-dashboard/components/ExpenseBreakdownCard';
import { InventorySummaryCard } from '@/features/admin-dashboard/components/InventorySummaryCard';
import { RecentTransactionsCard } from '@/features/admin-dashboard/components/RecentTransactionsCard';
import { ProfitabilityCard } from '@/features/admin-dashboard/components/ProfitabilityCard';

/**
 * ShopPOS admin overview. A business-performance cockpit composed from three
 * queries (POS dashboard + accounting P&L + loyalty) via {@link useDashboardPage}.
 * The page only gates on the primary POS query; P&L/loyalty-backed widgets fill
 * in progressively and each guards its own empty/unavailable state.
 */
export function DashboardPage() {
    const p = useDashboardPage();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const recentTransactions = p.data?.recentTransactions ?? [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardHeader recentTransactions={recentTransactions} />

            <KpiRow
                data={p.data}
                profitLoss={p.profitLoss}
                loyalty={p.loyalty}
                revenueSpark={p.revenueSpark}
                ordersSpark={p.ordersSpark}
            />

            {/* Row 2 — revenue trend · branch split · top products */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.15fr_1.25fr] gap-4 mb-4">
                <RevenueTrendCard
                    trend={p.data?.dailyBreakdownByBranch}
                    branchColors={p.branchColors}
                />
                <RevenueByBranchCard
                    revenueByBranch={p.data?.revenueByBranch ?? []}
                    branchColors={p.branchColors}
                />
                <TopProductsCard products={p.data?.topProducts ?? []} />
            </div>

            {/* Row 3 — payment split · expense split · inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.15fr] gap-4 mb-4">
                <PaymentMethodsCard
                    data={p.data?.salesByPaymentMethod ?? []}
                />
                <ExpenseBreakdownCard profitLoss={p.profitLoss} />
                <InventorySummaryCard inventory={p.data?.inventorySummary} />
            </div>

            {/* Row 4 — recent transactions · profitability */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-4">
                <RecentTransactionsCard transactions={recentTransactions} />
                <ProfitabilityCard profitLoss={p.profitLoss} />
            </div>
        </div>
    );
}
