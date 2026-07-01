import {
  LuTrendingUp as TrendingUp,
  LuUserCheck as UserCheck,
  LuUserMinus as UserMinus,
  LuUsers as Users,
  LuUserX as UserX,
  LuWallet as Wallet,
} from "react-icons/lu";
import KpiCard from "@/components/ui/KpiCard";
import { formatCurrency } from "@/lib/utils";
import type { ICustomerAnalytics } from "@/types";

export function CustomerInsightsKpis({
  analytics: a,
}: {
  analytics: ICustomerAnalytics;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Total customers"
        value={a.totalCustomers.toLocaleString()}
        icon={<Users size={14} />}
      />
      <KpiCard
        label="Active · 90d"
        value={a.activeCustomers.toLocaleString()}
        accent="info"
        icon={<UserCheck size={14} />}
      />
      <KpiCard
        label="At risk"
        value={a.atRiskCustomers.toLocaleString()}
        accent="warning"
        icon={<UserMinus size={14} />}
      />
      <KpiCard
        label="Dormant"
        value={a.dormantCustomers.toLocaleString()}
        icon={<UserX size={14} />}
      />
      <KpiCard
        label="Avg lifetime value"
        value={formatCurrency(a.avgLifetimeValue)}
        accent="accent"
        icon={<TrendingUp size={14} />}
      />
      <KpiCard
        label="Total lifetime value"
        value={formatCurrency(a.totalLifetimeValue)}
        icon={<Wallet size={14} />}
      />
    </div>
  );
}
