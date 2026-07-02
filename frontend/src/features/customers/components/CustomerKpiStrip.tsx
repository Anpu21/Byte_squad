import {
  LuClock as Clock,
  LuHandCoins as HandCoins,
  LuReceipt as Receipt,
  LuSparkles as Sparkles,
  LuTrendingUp as TrendingUp,
  LuWallet as Wallet,
} from "react-icons/lu";
import KpiCard from "@/components/ui/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format-time-ago";
import type { ICustomerProfileKpis } from "@/types";

export function CustomerKpiStrip({ kpis }: { kpis: ICustomerProfileKpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Lifetime spend"
        value={formatCurrency(kpis.lifetimeSpend)}
        accent="accent"
        icon={<TrendingUp size={14} />}
      />
      <KpiCard
        label="Orders"
        value={kpis.ordersCount.toLocaleString()}
        icon={<Receipt size={14} />}
      />
      <KpiCard
        label="Avg order"
        value={formatCurrency(kpis.avgOrderValue)}
        icon={<Wallet size={14} />}
      />
      <KpiCard
        label="Loyalty points"
        value={kpis.loyaltyPoints.toLocaleString()}
        accent="info"
        icon={<Sparkles size={14} />}
      />
      <KpiCard
        label="Balance owed"
        value={formatCurrency(kpis.creditBalance)}
        accent={kpis.creditBalance > 0 ? "warning" : undefined}
        icon={<HandCoins size={14} />}
      />
      <KpiCard
        label="Last seen"
        value={kpis.lastSeenAt ? formatTimeAgo(kpis.lastSeenAt) : "—"}
        icon={<Clock size={14} />}
      />
    </div>
  );
}
