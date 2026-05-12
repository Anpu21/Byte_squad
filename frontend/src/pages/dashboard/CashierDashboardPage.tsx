import { Receipt } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCashierDashboard } from '@/features/cashier-dashboard/hooks/useCashierDashboard';
import { CashierKpis } from '@/features/cashier-dashboard/components/CashierKpis';
import { CashierSalesChart } from '@/features/cashier-dashboard/components/CashierSalesChart';
import { CashierRecentTransactions } from '@/features/cashier-dashboard/components/CashierRecentTransactions';

export function CashierDashboardPage() {
    const p = useCashierDashboard();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1">
                        Hi {p.user?.firstName ?? 'there'}
                    </h1>
                    <p className="text-xs text-text-2 mt-1">{p.todayLabel}</p>
                </div>
                <Button size="lg" onClick={p.goToPos}>
                    <Receipt size={16} /> Open POS
                </Button>
            </div>

            <CashierKpis data={p.data} sparkline={p.sparkline} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CashierSalesChart chartData={p.chartData} />
                <CashierRecentTransactions
                    transactions={p.data?.recentTransactions ?? []}
                />
            </div>
        </div>
    );
}
