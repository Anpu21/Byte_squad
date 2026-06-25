import {
    LuBanknote as Banknote,
    LuTrendingUp as TrendingUp,
    LuWallet as Wallet,
    LuReceipt as Receipt,
    LuShoppingBag as ShoppingBag,
    LuHeart as Heart,
} from 'react-icons/lu';
import { KpiCard, ICON } from '@/components/ui';
import type {
    IAdminDashboard,
    ILoyaltyDashboardStats,
    IProfitLossData,
} from '@/types';
import { formatRevenue } from '../lib/format';

interface KpiRowProps {
    data: IAdminDashboard | undefined;
    profitLoss: IProfitLossData | undefined;
    loyalty: ILoyaltyDashboardStats | undefined;
    /** Daily revenue series (week) for the Total Revenue sparkline. */
    revenueSpark: number[];
    /** Daily order-count series (week) for the Total Orders sparkline. */
    ordersSpark: number[];
}

const DASH = '—';

/**
 * Six headline KPIs. Revenue/AOV/orders/pending come from the POS dashboard,
 * gross/net profit from the accounting P&L, member count from loyalty. Where a
 * source hasn't loaded (or a manager lacks P&L access) the value falls back to
 * an em-dash rather than a misleading zero. Sparklines only appear where we
 * have a real daily series (revenue, orders) — never fabricated.
 */
export function KpiRow({
    data,
    profitLoss,
    loyalty,
    revenueSpark,
    ordersSpark,
}: KpiRowProps) {
    const money = (n: number | undefined) =>
        n === undefined ? DASH : formatRevenue(n);

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(212px,1fr))] gap-4 mb-4">
            <KpiCard
                label="Total Revenue"
                value={money(data?.week.totalSales)}
                accent="accent"
                icon={<Banknote size={ICON.sm} />}
                sparkData={revenueSpark.length ? revenueSpark : undefined}
                sparkColor="var(--accent)"
                sparkHeight={38}
                note="Last 7 days"
            />
            <KpiCard
                label="Gross Profit"
                value={money(profitLoss?.grossProfit)}
                accent="primary"
                icon={<TrendingUp size={ICON.sm} />}
                note={
                    profitLoss
                        ? `Margin ${profitLoss.grossMargin.toFixed(1)}%`
                        : undefined
                }
            />
            <KpiCard
                label="Net Profit"
                value={money(profitLoss?.netProfit)}
                accent="info"
                icon={<Wallet size={ICON.sm} />}
                note={
                    profitLoss
                        ? `Margin ${profitLoss.netMargin.toFixed(1)}%`
                        : undefined
                }
            />
            <KpiCard
                label="Avg Order Value"
                value={money(data?.today.averageSale)}
                accent="primary"
                icon={<Receipt size={ICON.sm} />}
                note="Per bill"
            />
            <KpiCard
                label="Total Orders"
                value={data ? String(data.week.transactionCount) : DASH}
                accent="primary"
                icon={<ShoppingBag size={ICON.sm} />}
                sparkData={ordersSpark.length ? ordersSpark : undefined}
                sparkColor="var(--primary)"
                sparkHeight={38}
                note={data ? `${data.pendingOrders} pending` : undefined}
            />
            <KpiCard
                label="Loyalty Members"
                value={loyalty ? loyalty.totalMembers.toLocaleString() : DASH}
                accent="accent"
                icon={<Heart size={ICON.sm} />}
                note="Enrolled"
            />
        </div>
    );
}
