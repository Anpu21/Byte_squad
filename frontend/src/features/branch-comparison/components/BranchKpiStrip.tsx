import { LuTriangleAlert as AlertTriangle, LuCircleDollarSign as CircleDollarSign, LuReceiptText as ReceiptText, LuShoppingBag as ShoppingBag, LuTrendingUp as TrendingUp, LuWalletCards as WalletCards } from 'react-icons/lu';
import KpiCard from "@/components/ui/KpiCard";
import type { IBranchAnalyticsComparisonResponse } from "@/types";
import { formatCurrencyWhole, formatNumber } from "../lib/format";

export function BranchKpiStrip({
  comparison,
}: {
  comparison: IBranchAnalyticsComparisonResponse;
}) {
  const totals = comparison.totals;
  const stockRisk =
    totals.inventory.lowStockItems + totals.inventory.outOfStockItems;
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Revenue"
        value={formatCurrencyWhole(totals.financial.revenue)}
        delta={`${formatNumber(totals.sales.transactionCount)} bills`}
        icon={<CircleDollarSign size={14} />}
      />
      <KpiCard
        label="Gross profit"
        value={formatCurrencyWhole(totals.financial.grossProfit)}
        delta={`${(totals.financial.expenseRatio * 100).toFixed(1)}% expense`}
        deltaPositive={totals.financial.grossProfit >= 0}
        icon={<TrendingUp size={14} />}
      />
      <KpiCard
        label="AOV"
        value={formatCurrencyWhole(totals.sales.avgTransactionValue)}
        delta="Across selected branches"
        icon={<ReceiptText size={14} />}
      />
      <KpiCard
        label="Inventory risk"
        value={formatNumber(stockRisk)}
        delta={`${formatNumber(totals.inventory.outOfStockItems)} out`}
        deltaPositive={stockRisk === 0}
        icon={<AlertTriangle size={14} />}
      />
      <KpiCard
        label="Loyalty liability"
        value={formatCurrencyWhole(totals.loyalty.liabilityValue)}
        delta={`${formatNumber(totals.loyalty.activeMembers)} members`}
        icon={<WalletCards size={14} />}
      />
      <KpiCard
        label="Pickup orders"
        value={formatNumber(totals.customers.pickupOrders)}
        delta={`${formatNumber(totals.customers.completedOrders)} done`}
        icon={<ShoppingBag size={14} />}
      />
    </div>
  );
}
