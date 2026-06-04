import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { Payment } from '@pos/entities/payment.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { User } from '@users/entities/user.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { ExpenseStatus } from '@common/enums/expense-status.enum';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import { TransactionType } from '@common/enums/transaction.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import type {
  BranchAnalyticsComparisonEntry,
  BranchAnalyticsComparisonResponse,
  BranchAnalyticsSection,
  BranchAnalyticsSettings,
  BranchAnalyticsTotals,
  BranchCustomerMetrics,
  BranchFinancialMetrics,
  BranchInventoryMetrics,
  BranchLoyaltyMetrics,
  BranchPaymentMetrics,
  BranchSalesMetrics,
  BranchStaffMetrics,
} from './types';

interface ComparisonParams {
  branches: Branch[];
  startDate: Date;
  endDate: Date;
  sections: Set<BranchAnalyticsSection>;
  settings: BranchAnalyticsSettings;
  ownBranchId: string | null;
}

interface SalesAggRaw {
  revenue: string | null;
  transactionCount: string | null;
  discountTotal: string | null;
  taxTotal: string | null;
}

interface ExpenseAggRaw {
  expenses: string | null;
}

interface InventoryAggRaw {
  activeProducts: string | null;
  lowStockItems: string | null;
  outOfStockItems: string | null;
  totalStockQuantity: string | null;
}

interface LoyaltyLedgerAggRaw {
  pointsEarned: string | null;
  pointsRedeemed: string | null;
  pointsReversed: string | null;
  physicalEvents: string | null;
  onlineEvents: string | null;
  physicalPoints: string | null;
  onlinePoints: string | null;
}

interface LoyaltyAccountRaw {
  accountId: string;
  pointsBalance: string | number;
  lifetimePointsEarned: string | number;
}

interface CustomerAggRaw {
  pickupOrders: string | null;
  completedOrders: string | null;
  cancelledOrders: string | null;
  rejectedOrders: string | null;
  uniqueCustomers: string | null;
}

interface PaymentAggRaw {
  cashAmount: string | null;
  cardAmount: string | null;
  mobileAmount: string | null;
  chequeAmount: string | null;
  bankAmount: string | null;
  creditAmount: string | null;
}

@Injectable()
export class BranchAnalyticsRepository {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyLedgerEntry)
    private readonly loyaltyLedgerRepo: Repository<LoyaltyLedgerEntry>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findBranchesByIds(ids: readonly string[]): Promise<Branch[]> {
    if (ids.length === 0) return [];
    const rows = await this.branchRepo
      .createQueryBuilder('branch')
      .where('branch.id IN (:...ids)', { ids: [...ids] })
      .getMany();
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id)).filter((row): row is Branch => !!row);
  }

  async getComparison(
    params: ComparisonParams,
  ): Promise<BranchAnalyticsComparisonResponse> {
    const branches = await Promise.all(
      params.branches.map((branch) => this.getBranchEntry(branch, params)),
    );

    return {
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      branches,
      totals: this.buildTotals(branches),
    };
  }

  private async getBranchEntry(
    branch: Branch,
    params: ComparisonParams,
  ): Promise<BranchAnalyticsComparisonEntry> {
    const entry = this.emptyEntry(branch, params.ownBranchId);

    const [financialAndSales, inventory, loyalty, customers, payments, staff] =
      await Promise.all([
        this.shouldRun(params.sections, 'financial', 'sales')
          ? this.getFinancialAndSales(
              branch.id,
              params.startDate,
              params.endDate,
            )
          : Promise.resolve(null),
        params.sections.has('inventory')
          ? this.getInventory(branch.id)
          : Promise.resolve(null),
        params.sections.has('loyalty')
          ? this.getLoyalty(
              branch.id,
              params.startDate,
              params.endDate,
              params.settings,
            )
          : Promise.resolve(null),
        params.sections.has('customers')
          ? this.getCustomers(branch.id, params.startDate, params.endDate)
          : Promise.resolve(null),
        params.sections.has('payments')
          ? this.getPayments(branch.id, params.startDate, params.endDate)
          : Promise.resolve(null),
        params.sections.has('staff')
          ? this.getStaff(branch.id)
          : Promise.resolve(null),
      ]);

    if (financialAndSales) {
      entry.financial = financialAndSales.financial;
      entry.sales = financialAndSales.sales;
    }
    if (inventory) entry.inventory = inventory;
    if (loyalty) entry.loyalty = loyalty;
    if (customers) entry.customers = customers;
    if (payments) entry.payments = payments;
    if (staff) {
      entry.staff = {
        ...staff,
        revenuePerStaff:
          staff.staffCount > 0 ? entry.financial.revenue / staff.staffCount : 0,
      };
    }

    return entry;
  }

  private async getFinancialAndSales(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ financial: BranchFinancialMetrics; sales: BranchSalesMetrics }> {
    const [salesAgg, expensesAgg, topProducts] = await Promise.all([
      this.saleRepo
        .createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.total), 0)', 'revenue')
        .addSelect('COUNT(sale.id)', 'transactionCount')
        .addSelect('COALESCE(SUM(sale.discount_amount), 0)', 'discountTotal')
        .addSelect('COALESCE(SUM(sale.tax_amount), 0)', 'taxTotal')
        .where('sale.branch_id = :branchId', { branchId })
        .andWhere('sale.type = :type', { type: TransactionType.SALE })
        .andWhere('sale.status != :voided', { voided: 'Voided' })
        .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getRawOne<SalesAggRaw>(),
      this.expenseRepo
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.amount), 0)', 'expenses')
        .where('expense.branch_id = :branchId', { branchId })
        .andWhere('expense.status = :status', {
          status: ExpenseStatus.APPROVED,
        })
        .andWhere('expense.expense_date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getRawOne<ExpenseAggRaw>(),
      this.saleItemRepo
        .createQueryBuilder('item')
        .innerJoin('item.sale', 'sale')
        .innerJoin('item.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'productName')
        .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
        .addSelect('COALESCE(SUM(item.line_total), 0)', 'revenue')
        .where('sale.branch_id = :branchId', { branchId })
        .andWhere('sale.type = :type', { type: TransactionType.SALE })
        .andWhere('sale.status != :voided', { voided: 'Voided' })
        .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy('product.id')
        .addGroupBy('product.name')
        .orderBy('COALESCE(SUM(item.line_total), 0)', 'DESC')
        .limit(5)
        .getRawMany<{
          productId: string;
          productName: string;
          quantity: string | null;
          revenue: string | null;
        }>(),
    ]);

    const revenue = Number(salesAgg?.revenue ?? 0);
    const expenses = Number(expensesAgg?.expenses ?? 0);
    const transactionCount = Number(salesAgg?.transactionCount ?? 0);

    return {
      financial: {
        revenue,
        expenses,
        grossProfit: revenue - expenses,
        expenseRatio: revenue > 0 ? expenses / revenue : 0,
      },
      sales: {
        transactionCount,
        avgTransactionValue:
          transactionCount > 0 ? revenue / transactionCount : 0,
        discountTotal: Number(salesAgg?.discountTotal ?? 0),
        taxTotal: Number(salesAgg?.taxTotal ?? 0),
        topProducts: topProducts.map((row) => ({
          productId: row.productId,
          productName: row.productName,
          quantity: Number(row.quantity ?? 0),
          revenue: Number(row.revenue ?? 0),
        })),
      },
    };
  }

  private async getInventory(
    branchId: string,
  ): Promise<BranchInventoryMetrics> {
    const raw = await this.inventoryRepo
      .createQueryBuilder('inventory')
      .innerJoin('inventory.product', 'product')
      .select(
        `COUNT(*) FILTER (
          WHERE inventory.quantity > 0 AND product.is_active = true
        )`,
        'activeProducts',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE inventory.quantity > 0
            AND inventory.quantity <= inventory.low_stock_threshold
            AND product.is_active = true
        )`,
        'lowStockItems',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE inventory.quantity = 0 AND product.is_active = true
        )`,
        'outOfStockItems',
      )
      .addSelect(
        `COALESCE(SUM(
          CASE WHEN product.is_active = true THEN inventory.quantity ELSE 0 END
        ), 0)`,
        'totalStockQuantity',
      )
      .where('inventory.branch_id = :branchId', { branchId })
      .getRawOne<InventoryAggRaw>();

    return {
      activeProducts: Number(raw?.activeProducts ?? 0),
      lowStockItems: Number(raw?.lowStockItems ?? 0),
      outOfStockItems: Number(raw?.outOfStockItems ?? 0),
      totalStockQuantity: Number(raw?.totalStockQuantity ?? 0),
    };
  }

  private async getLoyalty(
    branchId: string,
    startDate: Date,
    endDate: Date,
    settings: BranchAnalyticsSettings,
  ): Promise<BranchLoyaltyMetrics> {
    const ownerJoin = `
      (
        le.user_id IS NOT NULL
        AND acc.user_id = le.user_id
      )
      OR (
        le.loyalty_customer_id IS NOT NULL
        AND acc.loyalty_customer_id = le.loyalty_customer_id
      )
    `;

    const [ledgerRaw, accountRows] = await Promise.all([
      this.loyaltyLedgerRepo
        .createQueryBuilder('le')
        .leftJoin(CustomerOrder, 'co', 'co.id = le.order_id')
        .select(
          `COALESCE(SUM(CASE WHEN le.type = :earned THEN le.points ELSE 0 END), 0)`,
          'pointsEarned',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN le.type = :redeemed THEN le.points ELSE 0 END), 0)`,
          'pointsRedeemed',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN le.type IN (:...reversalTypes) THEN le.points ELSE 0 END), 0)`,
          'pointsReversed',
        )
        .addSelect(
          `COUNT(le.id) FILTER (WHERE co.id IS NULL)`,
          'physicalEvents',
        )
        .addSelect(
          `COUNT(le.id) FILTER (WHERE co.id IS NOT NULL)`,
          'onlineEvents',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN co.id IS NULL THEN le.points ELSE 0 END), 0)`,
          'physicalPoints',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN co.id IS NOT NULL THEN le.points ELSE 0 END), 0)`,
          'onlinePoints',
        )
        .where('le.branch_id = :branchId', { branchId })
        .andWhere('le.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .setParameters({
          earned: LoyaltyLedgerEntryType.EARNED,
          redeemed: LoyaltyLedgerEntryType.REDEEMED,
          reversalTypes: [
            LoyaltyLedgerEntryType.REVERSED,
            LoyaltyLedgerEntryType.EARN_REVERSED,
          ],
        })
        .getRawOne<LoyaltyLedgerAggRaw>(),
      this.loyaltyAccountRepo
        .createQueryBuilder('acc')
        .distinct(true)
        .innerJoin(LoyaltyLedgerEntry, 'le', ownerJoin)
        .select('acc.id', 'accountId')
        .addSelect('acc.points_balance', 'pointsBalance')
        .addSelect('acc.lifetime_points_earned', 'lifetimePointsEarned')
        .where('le.branch_id = :branchId', { branchId })
        .andWhere('le.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getRawMany<LoyaltyAccountRaw>(),
    ]);

    const tierCounts = { bronze: 0, silver: 0, gold: 0 };
    let pointsBalance = 0;
    for (const row of accountRows) {
      const lifetime = Number(row.lifetimePointsEarned ?? 0);
      pointsBalance += Number(row.pointsBalance ?? 0);
      if (lifetime >= settings.goldTierPoints) tierCounts.gold += 1;
      else if (lifetime >= settings.silverTierPoints) tierCounts.silver += 1;
      else tierCounts.bronze += 1;
    }

    return {
      activeMembers: accountRows.length,
      pointsEarned: Number(ledgerRaw?.pointsEarned ?? 0),
      pointsRedeemed: Number(ledgerRaw?.pointsRedeemed ?? 0),
      pointsReversed: Number(ledgerRaw?.pointsReversed ?? 0),
      liabilityValue: pointsBalance * settings.pointValue,
      tierCounts,
      channelSplit: {
        physicalEvents: Number(ledgerRaw?.physicalEvents ?? 0),
        onlineEvents: Number(ledgerRaw?.onlineEvents ?? 0),
        physicalPoints: Number(ledgerRaw?.physicalPoints ?? 0),
        onlinePoints: Number(ledgerRaw?.onlinePoints ?? 0),
      },
    };
  }

  private async getCustomers(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BranchCustomerMetrics> {
    const raw = await this.orderRepo
      .createQueryBuilder('orders')
      .select('COUNT(orders.id)', 'pickupOrders')
      .addSelect(
        `COUNT(orders.id) FILTER (WHERE orders.status = :completed)`,
        'completedOrders',
      )
      .addSelect(
        `COUNT(orders.id) FILTER (WHERE orders.status = :cancelled)`,
        'cancelledOrders',
      )
      .addSelect(
        `COUNT(orders.id) FILTER (WHERE orders.status = :rejected)`,
        'rejectedOrders',
      )
      .addSelect('COUNT(DISTINCT orders.user_id)', 'uniqueCustomers')
      .where('orders.branch_id = :branchId', { branchId })
      .andWhere('orders.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .setParameters({
        completed: CustomerOrderStatus.COMPLETED,
        cancelled: CustomerOrderStatus.CANCELLED,
        rejected: CustomerOrderStatus.REJECTED,
      })
      .getRawOne<CustomerAggRaw>();

    return {
      pickupOrders: Number(raw?.pickupOrders ?? 0),
      completedOrders: Number(raw?.completedOrders ?? 0),
      cancelledOrders: Number(raw?.cancelledOrders ?? 0),
      rejectedOrders: Number(raw?.rejectedOrders ?? 0),
      uniqueCustomers: Number(raw?.uniqueCustomers ?? 0),
    };
  }

  private async getPayments(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BranchPaymentMetrics> {
    const raw = await this.paymentRepo
      .createQueryBuilder('payment')
      .innerJoin('payment.sale', 'sale')
      .select('COALESCE(SUM(payment.cash_amount), 0)', 'cashAmount')
      .addSelect(
        `COALESCE(SUM(CASE WHEN payment.payment_method = 'Card' THEN payment.payment_amount ELSE 0 END), 0)`,
        'cardAmount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN payment.payment_method = 'Mobile' THEN payment.payment_amount ELSE 0 END), 0)`,
        'mobileAmount',
      )
      .addSelect('COALESCE(SUM(payment.cheque_amount), 0)', 'chequeAmount')
      .addSelect('COALESCE(SUM(payment.bank_transfer_amount), 0)', 'bankAmount')
      .addSelect('COALESCE(SUM(payment.credit_amount), 0)', 'creditAmount')
      .where('sale.branch_id = :branchId', { branchId })
      .andWhere('sale.type = :type', { type: TransactionType.SALE })
      .andWhere('sale.status != :voided', { voided: 'Voided' })
      .andWhere('payment.status = :paymentStatus', { paymentStatus: 'Active' })
      .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne<PaymentAggRaw>();

    return {
      cashAmount: Number(raw?.cashAmount ?? 0),
      cardAmount: Number(raw?.cardAmount ?? 0),
      mobileAmount: Number(raw?.mobileAmount ?? 0),
      chequeAmount: Number(raw?.chequeAmount ?? 0),
      bankAmount: Number(raw?.bankAmount ?? 0),
      creditAmount: Number(raw?.creditAmount ?? 0),
    };
  }

  private async getStaff(branchId: string): Promise<BranchStaffMetrics> {
    const staffCount = await this.userRepo
      .createQueryBuilder('user')
      .where('user.branch_id = :branchId', { branchId })
      .andWhere('user.role IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
      })
      .getCount();

    return { staffCount, revenuePerStaff: 0 };
  }

  private shouldRun(
    sections: Set<BranchAnalyticsSection>,
    ...candidates: BranchAnalyticsSection[]
  ): boolean {
    return candidates.some((section) => sections.has(section));
  }

  private emptyEntry(
    branch: Branch,
    ownBranchId: string | null,
  ): BranchAnalyticsComparisonEntry {
    return {
      branchId: branch.id,
      branchName: branch.name,
      isOwnBranch: ownBranchId === branch.id,
      financial: this.emptyFinancial(),
      sales: this.emptySales(),
      inventory: this.emptyInventory(),
      loyalty: this.emptyLoyalty(),
      customers: this.emptyCustomers(),
      payments: this.emptyPayments(),
      staff: this.emptyStaff(),
    };
  }

  private emptyFinancial(): BranchFinancialMetrics {
    return { revenue: 0, expenses: 0, grossProfit: 0, expenseRatio: 0 };
  }

  private emptySales(): BranchSalesMetrics {
    return {
      transactionCount: 0,
      avgTransactionValue: 0,
      discountTotal: 0,
      taxTotal: 0,
      topProducts: [],
    };
  }

  private emptyInventory(): BranchInventoryMetrics {
    return {
      activeProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalStockQuantity: 0,
    };
  }

  private emptyLoyalty(): BranchLoyaltyMetrics {
    return {
      activeMembers: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      pointsReversed: 0,
      liabilityValue: 0,
      tierCounts: { bronze: 0, silver: 0, gold: 0 },
      channelSplit: {
        physicalEvents: 0,
        onlineEvents: 0,
        physicalPoints: 0,
        onlinePoints: 0,
      },
    };
  }

  private emptyCustomers(): BranchCustomerMetrics {
    return {
      pickupOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      rejectedOrders: 0,
      uniqueCustomers: 0,
    };
  }

  private emptyPayments(): BranchPaymentMetrics {
    return {
      cashAmount: 0,
      cardAmount: 0,
      mobileAmount: 0,
      chequeAmount: 0,
      bankAmount: 0,
      creditAmount: 0,
    };
  }

  private emptyStaff(): BranchStaffMetrics {
    return { staffCount: 0, revenuePerStaff: 0 };
  }

  private buildTotals(
    branches: BranchAnalyticsComparisonEntry[],
  ): BranchAnalyticsTotals {
    const totals: BranchAnalyticsTotals = {
      financial: this.emptyFinancial(),
      sales: {
        transactionCount: 0,
        avgTransactionValue: 0,
        discountTotal: 0,
        taxTotal: 0,
      },
      inventory: this.emptyInventory(),
      loyalty: this.emptyLoyalty(),
      customers: this.emptyCustomers(),
      payments: this.emptyPayments(),
      staff: this.emptyStaff(),
    };

    for (const branch of branches) {
      totals.financial.revenue += branch.financial.revenue;
      totals.financial.expenses += branch.financial.expenses;
      totals.financial.grossProfit += branch.financial.grossProfit;
      totals.sales.transactionCount += branch.sales.transactionCount;
      totals.sales.discountTotal += branch.sales.discountTotal;
      totals.sales.taxTotal += branch.sales.taxTotal;
      totals.inventory.activeProducts += branch.inventory.activeProducts;
      totals.inventory.lowStockItems += branch.inventory.lowStockItems;
      totals.inventory.outOfStockItems += branch.inventory.outOfStockItems;
      totals.inventory.totalStockQuantity +=
        branch.inventory.totalStockQuantity;
      totals.loyalty.activeMembers += branch.loyalty.activeMembers;
      totals.loyalty.pointsEarned += branch.loyalty.pointsEarned;
      totals.loyalty.pointsRedeemed += branch.loyalty.pointsRedeemed;
      totals.loyalty.pointsReversed += branch.loyalty.pointsReversed;
      totals.loyalty.liabilityValue += branch.loyalty.liabilityValue;
      totals.loyalty.tierCounts.bronze += branch.loyalty.tierCounts.bronze;
      totals.loyalty.tierCounts.silver += branch.loyalty.tierCounts.silver;
      totals.loyalty.tierCounts.gold += branch.loyalty.tierCounts.gold;
      totals.loyalty.channelSplit.physicalEvents +=
        branch.loyalty.channelSplit.physicalEvents;
      totals.loyalty.channelSplit.onlineEvents +=
        branch.loyalty.channelSplit.onlineEvents;
      totals.loyalty.channelSplit.physicalPoints +=
        branch.loyalty.channelSplit.physicalPoints;
      totals.loyalty.channelSplit.onlinePoints +=
        branch.loyalty.channelSplit.onlinePoints;
      totals.customers.pickupOrders += branch.customers.pickupOrders;
      totals.customers.completedOrders += branch.customers.completedOrders;
      totals.customers.cancelledOrders += branch.customers.cancelledOrders;
      totals.customers.rejectedOrders += branch.customers.rejectedOrders;
      totals.customers.uniqueCustomers += branch.customers.uniqueCustomers;
      totals.payments.cashAmount += branch.payments.cashAmount;
      totals.payments.cardAmount += branch.payments.cardAmount;
      totals.payments.mobileAmount += branch.payments.mobileAmount;
      totals.payments.chequeAmount += branch.payments.chequeAmount;
      totals.payments.bankAmount += branch.payments.bankAmount;
      totals.payments.creditAmount += branch.payments.creditAmount;
      totals.staff.staffCount += branch.staff.staffCount;
    }

    totals.financial.expenseRatio =
      totals.financial.revenue > 0
        ? totals.financial.expenses / totals.financial.revenue
        : 0;
    totals.sales.avgTransactionValue =
      totals.sales.transactionCount > 0
        ? totals.financial.revenue / totals.sales.transactionCount
        : 0;
    totals.staff.revenuePerStaff =
      totals.staff.staffCount > 0
        ? totals.financial.revenue / totals.staff.staffCount
        : 0;

    return totals;
  }
}
