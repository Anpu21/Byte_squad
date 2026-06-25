import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { DailyBreakdown } from '@/modules/pos-sales/types/daily-breakdown.type';
import { TopProduct } from '@/modules/pos-sales/types/top-product.type';
import { PaymentMethodBreakdown } from '@/modules/pos-sales/types/payment-method-breakdown.type';
import { RevenueByBranch } from '@/modules/pos-sales/types/revenue-by-branch.type';
import { DailyBreakdownByBranch } from '@/modules/pos-sales/types/daily-breakdown-by-branch.type';
import { InventorySummary } from '@/modules/pos-sales/types/inventory-summary.type';

export interface AdminDashboardData {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  month: {
    totalRevenue: number;
    transactionCount: number;
  };
  stats: {
    activeProducts: number;
    lowStockItems: number;
    totalUsers: number;
    totalBranches: number;
  };
  dailyBreakdown: DailyBreakdown[];
  topProducts: TopProduct[];
  recentTransactions: Sale[];

  // ── ShopPOS dashboard redesign (additive; consumed by the admin overview) ──
  /** "Sales by Payment Method" donut — over the 7-day window. */
  salesByPaymentMethod: PaymentMethodBreakdown[];
  /** "Revenue by Branch" donut — over the 7-day window, branches desc. */
  revenueByBranch: RevenueByBranch[];
  /** Multi-line "Revenue Trend" — one zero-filled series per branch, 7 days. */
  dailyBreakdownByBranch: DailyBreakdownByBranch;
  /** "Inventory Summary" tiles (count + valuation), branch-scoped for managers. */
  inventorySummary: InventorySummary;
  /** Unpaid/partially-paid sales in the window — the Total Orders "pending" note. */
  pendingOrders: number;
}
