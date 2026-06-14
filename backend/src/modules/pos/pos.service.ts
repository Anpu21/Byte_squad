import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import type { Product } from '@products/entities/product.entity';
import type { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto.js';
import { SearchProductsQueryDto } from '@pos/dto/search-products-query.dto';
import { SearchCustomersQueryDto } from '@pos/dto/search-customers-query.dto';
import { PosRepository } from '@pos/pos.repository';
import { AccountingService } from '@accounting/accounting.service';
import { ProductsService } from '@products/products.service';
import { InventoryService } from '@inventory/inventory.service';
import { Inventory } from '@inventory/entities/inventory.entity';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { TransactionType } from '@common/enums/transaction.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { InvoiceNumberService } from '@pos/services/invoice-number.service';
import { SaleRepository } from '@pos/sale.repository';
import { UsersService } from '@users/users.service';
import type {
  SearchProductRow,
  ProductUnitRow,
  InventoryQuantity,
  RecentSaleRow,
  CustomerSearchRow,
} from '@pos/types';

/**
 * Shape of `@CurrentUser()` payloads injected into POS endpoints. Mirrors the
 * decorator's inline type (see `common/decorators/current-user.decorator.ts`)
 * without leaking the decorator's private interface into this file.
 */
interface ActorPayload {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// A line discount may be either a percentage of the line base (qty × unitPrice)
// or a fixed money amount; treating the percentage value as money produces
// totals that are right at qty=1 by coincidence and wrong everywhere else.
function computeLineTotal(
  unitPrice: number,
  quantity: number,
  discountAmount: number,
  discountType: DiscountType,
): number {
  const base = unitPrice * quantity;
  if (discountAmount <= 0) return round2(base);
  const off =
    discountType === DiscountType.PERCENTAGE
      ? base * (discountAmount / 100)
      : discountAmount;
  return round2(Math.max(0, base - off));
}

function mapMatchedUnit(
  unit: ProductSellableUnit | null,
): SearchProductRow['matchedUnit'] {
  if (!unit) return null;
  return {
    unitId: unit.id,
    unitName: unit.name,
    barcode: unit.barcode,
    conversionToBase: Number(unit.conversionToBase),
    sellingPrice: Number(unit.sellingPrice),
  };
}

function mapProductSearchRow(
  product: Product,
  matchedUnit: ProductSellableUnit | null,
): SearchProductRow {
  return {
    productId: product.id,
    productCode: product.barcode,
    productName: product.name,
    productType: product.category,
    baseUnit: product.baseUnit,
    status: product.isActive,
    costPrice: Number(product.costPrice),
    retailPrice: Number(product.sellingPrice),
    taxRate: Number(product.taxRate),
    discountAllowed: product.discountAllowed,
    imageUrl: product.imageUrl,
    matchedUnit: mapMatchedUnit(matchedUnit),
  };
}
import {
  DailyBreakdown,
  TopProduct,
  AdminDashboardData,
  CashierDashboardData,
  CashierPeriodStats,
  CashierTransactionRow,
  CashierTransactionsSummary,
} from '@pos/types';

// Re-export so existing consumers that imported these from '@pos/pos.service'
// keep working without a broad rename. New code should import from '@pos/types'.
export type {
  DailyBreakdown,
  TopProduct,
  AdminDashboardData,
  CashierDashboardData,
  CashierPeriodStats,
  CashierTransactionRow,
  CashierTransactionsSummary,
};

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly pos: PosRepository,
    private readonly accounting: AccountingService,
    private readonly dataSource: DataSource,
    private readonly products: ProductsService,
    private readonly inventory: InventoryService,
    private readonly invoiceNumbers: InvoiceNumberService,
    private readonly sales: SaleRepository,
    private readonly users: UsersService,
  ) {}

  async createTransaction(
    dto: CreateTransactionDto,
    cashierId: string,
    branchId: string,
    idempotencyKey?: string,
  ): Promise<Sale> {
    const trimmedKey = idempotencyKey?.trim();
    if (trimmedKey) {
      const existing = await this.pos.findIdempotencyKey(cashierId, trimmedKey);
      if (existing) {
        this.logger.log(
          `Idempotency replay: cashier=${cashierId} key=${trimmedKey} → sale=${existing.saleId}`,
        );
        const replay = await this.findById(existing.saleId);
        if (!replay) {
          throw new NotFoundException('Original transaction no longer exists');
        }
        return replay;
      }
    }

    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const items = dto.items.map((item) => {
      const discountAmount = item.discountAmount ?? 0;
      const discountType = item.discountType ?? DiscountType.NONE;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        discountType,
        lineTotal: computeLineTotal(
          item.unitPrice,
          item.quantity,
          discountAmount,
          discountType,
        ),
      };
    });

    const subtotal = round2(
      items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    );
    const afterLineDiscounts = round2(
      items.reduce((sum, it) => sum + it.lineTotal, 0),
    );

    const cartDiscountAmount = dto.discountAmount ?? 0;
    const cartDiscountType = dto.discountType ?? DiscountType.NONE;
    const cartDiscountValue =
      cartDiscountAmount > 0
        ? cartDiscountType === DiscountType.PERCENTAGE
          ? round2(afterLineDiscounts * (cartDiscountAmount / 100))
          : round2(cartDiscountAmount)
        : 0;

    const total = round2(Math.max(0, afterLineDiscounts - cartDiscountValue));

    const saved = await this.dataSource.transaction(async (manager) => {
      if (dto.type === TransactionType.SALE) {
        const inventoryRepo = manager.getRepository(Inventory);
        for (const item of items) {
          const inv = await inventoryRepo
            .createQueryBuilder('inv')
            .setLock('pessimistic_write')
            .where('inv.product_id = :productId', { productId: item.productId })
            .andWhere('inv.branch_id = :branchId', { branchId })
            .getOne();

          if (!inv) {
            throw new ConflictException(
              `Product ${item.productId} is not stocked at this branch`,
            );
          }
          if (inv.quantity < item.quantity) {
            throw new ConflictException(
              `Insufficient stock for product ${item.productId}: only ${inv.quantity} available (requested ${item.quantity})`,
            );
          }
          inv.quantity -= item.quantity;
          await inventoryRepo.save(inv);
        }
      }

      const txnRepo = manager.getRepository(Sale);
      const itemRepo = manager.getRepository(SaleItem);
      const txn = await txnRepo.save(
        txnRepo.create({
          transactionNumber,
          // PHASE-5: replace with InvoiceNumberService.next() inside this txn.
          // Until then, mirror the transactionNumber so the NOT NULL + UNIQUE
          // constraint on sales.invoice_number is satisfied for legacy writers.
          invoiceNumber: transactionNumber,
          branchId,
          cashierId,
          type: dto.type,
          subtotal,
          discountAmount: cartDiscountAmount,
          discountType: cartDiscountType,
          taxAmount: 0,
          total,
          paymentMethod: dto.paymentMethod,
        }),
      );
      await itemRepo.save(
        items.map((it) =>
          itemRepo.create({
            ...it,
            saleId: txn.id,
            // PHASE-5: replace with the conversion factor once this path
            // migrates to PosWriteService.createSale. CreateTransactionDto
            // pre-dates the sellable-units model, so quantity already equals
            // the base-unit quantity.
            baseUnitQty: it.quantity,
          }),
        ),
      );

      if (Number(txn.total) > 0) {
        await this.accounting.createLedgerEntryWithManager(manager, {
          branchId: txn.branchId,
          entryType: LedgerEntryType.CREDIT,
          amount: txn.total,
          description: `POS Sale — ${txn.transactionNumber}`,
          referenceNumber: txn.transactionNumber,
          saleId: txn.id,
        });
      }

      return txn;
    });

    if (trimmedKey) {
      try {
        await this.pos.insertIdempotencyKey({
          key: trimmedKey,
          cashierId,
          saleId: saved.id,
        });
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const winning = await this.pos.findIdempotencyKey(
            cashierId,
            trimmedKey,
          );
          if (winning && winning.saleId !== saved.id) {
            this.logger.warn(
              `Idempotency race: cashier=${cashierId} key=${trimmedKey} kept=${winning.saleId} discarded=${saved.id}`,
            );
            const replay = await this.findById(winning.saleId);
            if (replay) return replay;
          }
        }
        throw err;
      }
    }

    return saved;
  }

  async findAll(branchId: string): Promise<Sale[]> {
    return this.pos.findTransactionsByBranch(branchId);
  }

  async findById(id: string): Promise<Sale | null> {
    return this.pos.findTransactionById(id);
  }

  async getCashierDashboard(
    cashierId: string,
    branchId: string,
  ): Promise<CashierDashboardData> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const todayTransactions = await this.pos.findTransactionsForCashierSince(
      cashierId,
      branchId,
      todayStart,
    );
    const todayTotalSales = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );
    const todayCount = todayTransactions.length;
    const todayAvg = todayCount > 0 ? todayTotalSales / todayCount : 0;

    const weekTransactions = await this.pos.findTransactionsForCashierSince(
      cashierId,
      branchId,
      weekStart,
    );
    const weekTotalSales = weekTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );

    const dailyMap = new Map<string, { totalSales: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split('T')[0], { totalSales: 0, count: 0 });
    }
    for (const t of weekTransactions) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.totalSales += Number(t.total);
        entry.count += 1;
      }
    }

    const dailyBreakdown: DailyBreakdown[] = Array.from(
      dailyMap,
      ([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      }),
    );

    const recentTransactions = await this.pos.findRecentForCashier(
      cashierId,
      branchId,
      10,
    );

    return {
      today: {
        totalSales: Math.round(todayTotalSales * 100) / 100,
        transactionCount: todayCount,
        averageSale: Math.round(todayAvg * 100) / 100,
      },
      week: {
        totalSales: Math.round(weekTotalSales * 100) / 100,
        transactionCount: weekTransactions.length,
      },
      dailyBreakdown,
      recentTransactions,
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTxns = await this.pos.findTransactionsSince(todayStart);
    const todaySales = todayTxns.reduce((s, t) => s + Number(t.total), 0);
    const todayCount = todayTxns.length;
    const todayAvg = todayCount > 0 ? todaySales / todayCount : 0;

    const weekTxns = await this.pos.findTransactionsSince(weekStart);
    const weekSales = weekTxns.reduce((s, t) => s + Number(t.total), 0);

    const monthTxns = await this.pos.findTransactionsSince(monthStart);
    const monthRevenue = monthTxns.reduce((s, t) => s + Number(t.total), 0);

    const dailyMap = new Map<string, { totalSales: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split('T')[0], { totalSales: 0, count: 0 });
    }
    for (const t of weekTxns) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.totalSales += Number(t.total);
        entry.count += 1;
      }
    }
    const dailyBreakdown: DailyBreakdown[] = Array.from(
      dailyMap,
      ([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      }),
    );

    const topProductsRaw = await this.pos.topProductsSince(monthStart, 5);
    const topProducts: TopProduct[] = topProductsRaw.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalQuantity: r.totalQuantity,
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
    }));

    const recentTransactions = await this.pos.findRecent(10);

    const [activeProducts, lowStockItems, totalUsers, totalBranches] =
      await Promise.all([
        this.pos.countActiveProducts(),
        this.pos.countLowStockItems(),
        this.pos.countAllUsers(),
        this.pos.countActiveBranches(),
      ]);

    return {
      today: {
        totalSales: Math.round(todaySales * 100) / 100,
        transactionCount: todayCount,
        averageSale: Math.round(todayAvg * 100) / 100,
      },
      week: {
        totalSales: Math.round(weekSales * 100) / 100,
        transactionCount: weekTxns.length,
      },
      month: {
        totalRevenue: Math.round(monthRevenue * 100) / 100,
        transactionCount: monthTxns.length,
      },
      stats: {
        activeProducts,
        lowStockItems,
        totalUsers,
        totalBranches,
      },
      dailyBreakdown,
      topProducts,
      recentTransactions,
    };
  }

  async getTransactionsSummary(
    branchId: string,
    cashierId: string | null,
  ): Promise<CashierTransactionsSummary> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [todayAgg, monthAgg, yearAgg, recentTxns] = await Promise.all([
      this.pos.periodAggregateForBranch(branchId, todayStart, cashierId),
      this.pos.periodAggregateForBranch(branchId, monthStart, cashierId),
      this.pos.periodAggregateForBranch(branchId, yearStart, cashierId),
      this.pos.findRecentScopedTransactions(
        cashierId ? { cashierId, branchId } : { branchId },
      ),
    ]);

    const toStats = (agg: { total: number; count: number }) => ({
      totalSales: Math.round(agg.total * 100) / 100,
      transactionCount: agg.count,
    });

    return {
      scope: cashierId ? 'cashier' : 'branch',
      today: toStats(todayAgg),
      month: toStats(monthAgg),
      year: toStats(yearAgg),
      recentTransactions: recentTxns.map((t) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        total: Number(t.total),
        itemCount: t.items?.length ?? 0,
        cashierName: t.cashier
          ? `${t.cashier.firstName} ${t.cashier.lastName}`
          : 'Unknown',
        createdAt: t.createdAt,
      })),
    };
  }

  async getAllTransactionsSummary(): Promise<CashierTransactionsSummary> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [todayAgg, monthAgg, yearAgg, recentTxns] = await Promise.all([
      this.pos.periodAggregateSystem(todayStart),
      this.pos.periodAggregateSystem(monthStart),
      this.pos.periodAggregateSystem(yearStart),
      this.pos.findRecentWithBranch(200),
    ]);

    const toStats = (agg: { total: number; count: number }) => ({
      totalSales: Math.round(agg.total * 100) / 100,
      transactionCount: agg.count,
    });

    return {
      scope: 'system',
      today: toStats(todayAgg),
      month: toStats(monthAgg),
      year: toStats(yearAgg),
      recentTransactions: recentTxns.map((t) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        total: Number(t.total),
        itemCount: t.items?.length ?? 0,
        cashierName: t.cashier
          ? `${t.cashier.firstName} ${t.cashier.lastName}`
          : 'Unknown',
        branchName: t.branch?.name ?? null,
        createdAt: t.createdAt,
      })),
    };
  }

  // ---------------------------------------------------------------------
  // Phase 4 — Shanel-aligned read endpoints
  // ---------------------------------------------------------------------

  /**
   * Prefix-search active products by name or barcode for the cashier
   * typeahead. Empty query short-circuits to `[]` so the UI can clear its
   * dropdown without hitting the DB.
   *
   * `actor` is accepted for future branch-scoping (e.g. only return products
   * stocked at the cashier's branch) — today the query is global because
   * cashiers can sell any active product as long as inventory exists.
   */
  async searchProducts(
    _actor: ActorPayload,
    dto: SearchProductsQueryDto,
  ): Promise<SearchProductRow[]> {
    const term = (dto.q ?? '').trim();
    if (!term) return [];
    const limit = dto.limit ?? 10;
    const [exactUnit, exactProduct, prefixRows] = await Promise.all([
      this.products.findUnitByBarcode(term),
      this.products.findByBarcode(term),
      this.products.searchByText(term, limit),
    ]);

    const rows: SearchProductRow[] = [];
    const seenProductIds = new Set<string>();
    if (exactUnit) {
      rows.push(mapProductSearchRow(exactUnit.product, exactUnit));
      seenProductIds.add(exactUnit.productId);
    } else if (exactProduct?.isActive) {
      rows.push(mapProductSearchRow(exactProduct, null));
      seenProductIds.add(exactProduct.id);
    }

    for (const product of prefixRows) {
      if (rows.length >= limit) break;
      if (seenProductIds.has(product.id)) continue;
      rows.push(mapProductSearchRow(product, null));
      seenProductIds.add(product.id);
    }
    return rows;
  }

  /**
   * Prefix-match customers (role = CUSTOMER) so the cashier can attach a
   * customer to the in-progress sale. Returns a thin Shanel-shaped row so
   * the picker UI never has to know the full User entity. An empty trimmed
   * `q` short-circuits to an empty array so the typeahead doesn't blast the
   * DB on first focus.
   *
   * `currentBalance` is decimal in Postgres so TypeORM hands it back as a
   * string; the explicit `Number(...)` keeps the public contract numeric.
   */
  async searchCustomers(
    _actor: ActorPayload,
    dto: SearchCustomersQueryDto,
  ): Promise<CustomerSearchRow[]> {
    const term = (dto.q ?? '').trim();
    if (!term) return [];
    // Belt-and-suspenders clamp: the DTO already bounds `limit` via
    // class-validator (1..50, default 10) at the controller layer, but the
    // service is also called directly from tests/other callers, so keep
    // the explicit clamp here so misuse can't yield an unbounded LIMIT.
    const bounded = Math.max(1, Math.min(dto.limit ?? 10, 50));
    const rows = await this.users.searchCustomersByText(term, bounded);
    return rows.map((u) => ({
      userId: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      currentBalance: Number(u.currentBalance ?? 0),
    }));
  }

  /**
   * Returns sellable units for a product (kg/g, L/mL, each, …) sorted by the
   * configured display order. The cashier picks one of these when entering a
   * line so the typed quantity can be converted to the canonical base unit
   * before stock deduction.
   *
   * The repository hands back entities; we map to the Shanel-shaped
   * `ProductUnitRow` here so the pos types stay the public contract.
   */
  async listProductUnits(productId: string): Promise<ProductUnitRow[]> {
    const rows = await this.products.listUnits(productId);
    return rows.map((u) => ({
      unitId: u.id,
      unitName: u.name,
      barcode: u.barcode,
      isBaseUnit: u.isBase,
      conversionToBase: Number(u.conversionToBase),
      sellingPrice: Number(u.sellingPrice),
      displayOrder: u.displayOrder ?? 0,
    }));
  }

  /**
   * Returns the conversion factor used to turn a typed quantity in
   * `unitName` into the product's base-unit quantity. The cashier UI calls
   * this to pre-validate stock before checkout (Shanel ships this as a
   * separate endpoint even though the server also re-validates inside the
   * sale transaction).
   */
  async getBaseUnitQty(
    productId: string,
    unitName: string,
  ): Promise<{ conversionToBase: number; isBase: boolean }> {
    const units = await this.listProductUnits(productId);
    const match = units.find((u) => u.unitName === unitName);
    if (!match) {
      throw new NotFoundException(
        `Unit ${unitName} not configured for product ${productId}`,
      );
    }
    return {
      conversionToBase: match.conversionToBase,
      isBase: match.isBaseUnit,
    };
  }

  /**
   * Branch-scoped inventory snapshot for a single product. Non-admin
   * actors only ever see their own branch's `branchQty`; admins use their
   * primary `branchId` as the scope (or get an unscoped snapshot when
   * they have no primary branch). `totalAcrossBranches` is always the sum
   * across every inventory row regardless of scope.
   */
  async getProductInventory(
    actor: ActorPayload,
    productId: string,
  ): Promise<InventoryQuantity> {
    const branchId = actor.branchId;
    const summary = await this.inventory.summaryForProduct(productId, branchId);
    return {
      productId: summary.productId,
      branchId: summary.branchId,
      branchName: summary.branchName,
      branchQty: summary.branchQty,
      totalAcrossBranches: summary.totalAcrossBranches,
    };
  }

  /**
   * Returns the cashier's most-recent sales (newest first) shaped for the
   * "recent sales" panel. Branch-scoped for cashiers/managers; admins see
   * the whole system (no branchId filter).
   *
   * The Shanel row shape includes payment-status flags, void state, and
   * the customer name for credit sales — fields the cashier UI uses to
   * render badges without follow-up requests.
   */
  async getRecentSales(
    actor: ActorPayload,
    limit = 20,
  ): Promise<RecentSaleRow[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const branchId = actor.role === UserRole.ADMIN ? null : actor.branchId;
    const sales = await this.pos.findRecentSales(branchId, safeLimit);
    return sales.map(toRecentSaleRow);
  }

  /**
   * Preview the next invoice number without advancing the counter. The
   * cashier UI calls this while keying a sale; the authoritative number is
   * still issued atomically inside `createSale` (Phase 5). Concurrent
   * cashiers may briefly see the same preview — the UI reconciles on
   * commit.
   */
  async previewNextInvoiceNumber(): Promise<{ invoiceNo: string }> {
    const year = new Date().getFullYear();
    const invoiceNo = await this.invoiceNumbers.peek(year);
    return { invoiceNo };
  }

  // ---------------------------------------------------------------------
  // Phase 6 — Shanel-aligned mutations (print, void)
  // ---------------------------------------------------------------------

  /**
   * Record a receipt print for a sale. Increments `billPrintCount`, sets
   * `firstPrintDate` on the first print, and refreshes `lastPrintDate`.
   *
   * Branch scoping: cashiers/managers can only print sales on their own
   * branch — cross-branch attempts return `NotFoundException` (not 403)
   * so we don't leak the existence of sales that exist in other branches.
   * Admins can print any sale.
   *
   * Returns the refreshed sale so the cashier UI can update its row
   * without a follow-up GET.
   */
  async markPrinted(id: string, actor: ActorPayload): Promise<Sale> {
    const sale = await this.sales.findOneById(id);
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    if (actor.role !== UserRole.ADMIN && sale.branchId !== actor.branchId) {
      // Defensive 404 across branches — same shape as "not found" so the
      // existence of foreign-branch sales doesn't leak.
      throw new NotFoundException('Sale not found');
    }

    const now = new Date();
    const nextCount = (sale.billPrintCount ?? 0) + 1;
    const firstPrintDate = sale.firstPrintDate ?? now;
    await this.sales.markPrinted(id, {
      billPrinted: true,
      billPrintCount: nextCount,
      firstPrintDate,
      lastPrintDate: now,
    });

    const refreshed = await this.sales.findOneById(id);
    if (!refreshed) {
      throw new NotFoundException('Sale disappeared during print update');
    }
    return refreshed;
  }
}

/**
 * Map a Sale entity (with optional `customer` relation eager-loaded) into
 * the Shanel-aligned RecentSaleRow shape. Reads invoice-number and
 * bill-print columns directly off the entity.
 */
function toRecentSaleRow(sale: Sale): RecentSaleRow {
  const customer = sale.customer ?? null;
  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : null;
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    transactionNumber: sale.transactionNumber,
    total: Number(sale.total),
    paidAmount: Number(sale.paidAmount),
    balanceDue: Number(sale.balanceDue),
    paymentStatus: sale.paymentStatus,
    saleType: sale.saleType,
    status: sale.status,
    billPrinted: sale.billPrinted,
    billPrintCount: sale.billPrintCount,
    branchId: sale.branchId,
    customerUserId: sale.customerUserId,
    customerName,
    createdAt: sale.createdAt,
  };
}
