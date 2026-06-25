import { LuTriangleAlert as AlertTriangle, LuCircleDollarSign as CircleDollarSign, LuReceiptText as ReceiptText, LuShoppingBag as ShoppingBag, LuTrendingUp as TrendingUp, LuWalletCards as WalletCards } from 'react-icons/lu';
import KpiCard from "@/components/ui/KpiCard";
import type { IBranchAnalyticsComparisonResponse } from "@/types";
import { formatCurrencyWhole, formatNumber } from "../lib/format";

export function BranchKpiStrip({
  comparison,
  revenueSpark = [],
}: {
  comparison: IBranchAnalyticsComparisonResponse;
  /** Combined daily-revenue series for the Revenue sparkline (only KPI with a real series). */
  revenueSpark?: number[];
}) {
  const totals = comparison.totals;
  const stockRisk =
    totals.inventory.lowStockItems + totals.inventory.outOfStockItems;

  const revenue = totals.financial.revenue;
  const grossMargin = revenue > 0 ? (totals.financial.grossProfit / revenue) * 100 : 0;

  const pickup = totals.customers.pickupOrders;
  const completed = totals.customers.completedOrders;
  const pending = Math.max(
    0,
    pickup -
      completed -
      totals.customers.cancelledOrders -
      totals.customers.rejectedOrders,
  );
  const pickupDone = pickup > 0 ? Math.round((completed / pickup) * 100) : 0;

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Revenue"
        value={formatCurrencyWhole(revenue)}
        delta={`${formatNumber(totals.sales.transactionCount)} bills`}
        note="this period"
        accent="info"
        icon={<CircleDollarSign size={14} />}
        sparkData={revenueSpark.length > 1 ? revenueSpark : undefined}
        sparkColor="var(--info)"
      />
      <KpiCard
        label="Gross profit"
        value={formatCurrencyWhole(totals.financial.grossProfit)}
        delta={`${grossMargin.toFixed(1)}% margin`}
        deltaPositive={totals.financial.grossProfit >= 0}
        note={`${(totals.financial.expenseRatio * 100).toFixed(1)}% cost`}
        accent="accent"
        icon={<TrendingUp size={14} />}
      />
      <KpiCard
        label="AOV"
        value={formatCurrencyWhole(totals.sales.avgTransactionValue)}
        delta="per bill"
        icon={<ReceiptText size={14} />}
      />
      <KpiCard
        label="Inventory risk"
        value={formatNumber(stockRisk)}
        delta={`${formatNumber(totals.inventory.outOfStockItems)} out`}
        deltaPositive={stockRisk === 0}
        note="low + out of stock"
        accent="warning"
        icon={<AlertTriangle size={14} />}
      />
      <KpiCard
        label="Loyalty liability"
        value={formatCurrencyWhole(totals.loyalty.liabilityValue)}
        delta={`${formatNumber(totals.loyalty.activeMembers)} members`}
        note="outstanding"
        accent="info"
        icon={<WalletCards size={14} />}
      />
      <KpiCard
        label="Pickup orders"
        value={formatNumber(pickup)}
        delta={`${pickupDone}% done`}
        note={`${formatNumber(pending)} pending`}
        accent="accent"
        icon={<ShoppingBag size={14} />}
      />
    </div>
  );
}
