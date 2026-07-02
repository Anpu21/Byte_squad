import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { SalesReturnItem } from '@inventory/entities/sales-return-item.entity';
import { SalesReturnRepository } from '@inventory/sales-return.repository';
import { ReturnsAnalyticsRepository } from '@inventory/returns-analytics.repository';
import { ProductBatchRepository } from '@inventory/product-batch.repository';
import { PosService } from '@pos/pos.service';
import { AccountingService } from '@accounting/accounting.service';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { AuthUser } from '@common/types/auth-user.type';
import { CreateSalesReturnDto } from '@inventory/dto/create-sales-return.dto';
import { ListReturnsQueryDto } from '@inventory/dto/list-returns-query.dto';
import { ReturnsAnalyticsQueryDto } from '@inventory/dto/returns-analytics-query.dto';
import {
  PaginatedSalesReturns,
  ReturnableLine,
  ReturnsAnalytics,
  SaleReturnLookup,
} from '@inventory/types';

const ANALYTICS_DEFAULT_DAYS = 30;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

interface ReturnRestockOp {
  productId: string;
  baseQtyGood: number;
  /** Expiry for the recreated ProductBatch (null = unknown). */
  expiryDate: string | null;
}
interface ReturnDamageOp {
  productId: string;
  baseQtyBad: number;
}

/** Pre-transaction result of validating + pricing a return (see computeReturn). */
export interface ComputedReturn {
  sale: Sale;
  reason: string | null;
  returnItems: SalesReturnItem[];
  restockOps: ReturnRestockOp[];
  damageOps: ReturnDamageOp[];
  /** Full returned value (sum of item refunds). */
  totalRefund: number;
  restockedValue: number;
}

@Injectable()
export class ReturnsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly returns: SalesReturnRepository,
    private readonly analytics: ReturnsAnalyticsRepository,
    private readonly batches: ProductBatchRepository,
    private readonly sales: PosService,
    private readonly accounting: AccountingService,
  ) {}

  /** Look up a sale by invoice and report what's still returnable per line. */
  async lookupSale(
    actor: AuthUser,
    invoiceNumber: string,
  ): Promise<SaleReturnLookup> {
    const sale = await this.sales.findByInvoiceNumber(invoiceNumber.trim());
    if (!sale) {
      throw new NotFoundException(`No sale found for invoice ${invoiceNumber}`);
    }
    this.assertBranchAccess(actor, sale.branchId);
    if (sale.status === 'Voided') {
      throw new BadRequestException('This sale has been voided');
    }

    const returnedMap = await this.returns.returnedQtyBySale(sale.id);
    const lines: ReturnableLine[] = (sale.items ?? [])
      .filter((item) => item.status === 'Active')
      .map((item) => {
        const already = returnedMap.get(item.id) ?? 0;
        const remaining = round3(Number(item.quantity) - already);
        return {
          saleItemId: item.id,
          productId: item.productId,
          productName: item.product?.name ?? '',
          barcode: item.product?.barcode ?? '',
          unitLabel: item.unit?.name ?? null,
          quantitySold: Number(item.quantity),
          alreadyReturned: already,
          remaining,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        };
      });

    return {
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      branchId: sale.branchId,
      customerUserId: sale.customerUserId,
      total: Number(sale.total),
      createdAt: sale.createdAt,
      lines,
    };
  }

  /** Process a standalone return: restock good units, scrap bad, refund. */
  async createReturn(
    actor: AuthUser,
    dto: CreateSalesReturnDto,
  ): Promise<SalesReturn> {
    const computed = await this.computeReturn(actor, dto);
    return this.dataSource.transaction((manager) =>
      this.persistReturnWithinTxn(manager, actor, computed),
    );
  }

  /**
   * Pure, pre-transaction half of a return: validate the sale + lines and
   * compute the refund/restock/damage operations. Shared with the exchange
   * flow, which runs {@link persistReturnWithinTxn} inside its own transaction.
   */
  async computeReturn(
    actor: AuthUser,
    dto: CreateSalesReturnDto,
  ): Promise<ComputedReturn> {
    const sale = await this.sales.findOneById(dto.saleId);
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    this.assertBranchAccess(actor, sale.branchId);
    if (sale.status === 'Voided') {
      throw new BadRequestException('This sale has been voided');
    }

    const returnedMap = await this.returns.returnedQtyBySale(sale.id);
    const itemById = new Map((sale.items ?? []).map((i) => [i.id, i]));

    const returnItems: SalesReturnItem[] = [];
    const restockOps: ReturnRestockOp[] = [];
    const damageOps: ReturnDamageOp[] = [];
    let totalRefund = 0;
    let restockedValue = 0;

    for (const line of dto.lines) {
      const item = itemById.get(line.saleItemId);
      if (!item) {
        throw new BadRequestException(
          `Sale item ${line.saleItemId} is not on this sale`,
        );
      }
      const requested = round3(line.goodQuantity + line.badQuantity);
      if (requested <= 0) continue;

      const already = returnedMap.get(item.id) ?? 0;
      const remaining = round3(Number(item.quantity) - already);
      if (requested > remaining + 1e-9) {
        throw new BadRequestException(
          `Return exceeds remaining quantity for ${item.product?.name ?? item.id}`,
        );
      }

      const soldQty = Number(item.quantity);
      const perUnitBase = soldQty > 0 ? Number(item.baseUnitQty) / soldQty : 0;
      const perUnitRefund = soldQty > 0 ? Number(item.lineTotal) / soldQty : 0;
      const baseQtyGood = round3(line.goodQuantity * perUnitBase);
      const refundAmount = round2(requested * perUnitRefund);
      totalRefund = round2(totalRefund + refundAmount);

      const willRestock = line.restockGood && line.goodQuantity > 0;
      if (willRestock) {
        restockedValue = round2(
          restockedValue + round2(line.goodQuantity * perUnitRefund),
        );
        restockOps.push({
          productId: item.productId,
          baseQtyGood,
          expiryDate: line.expiryDate ?? null,
        });
      }

      // Bad units are refunded but never re-enter sellable stock; log them so
      // damaged returns are auditable (see the Damage movement below).
      if (line.badQuantity > 0) {
        const baseQtyBad = round3(line.badQuantity * perUnitBase);
        if (baseQtyBad > 0) {
          damageOps.push({ productId: item.productId, baseQtyBad });
        }
      }

      const ri = new SalesReturnItem();
      ri.saleItemId = item.id;
      ri.productId = item.productId;
      ri.goodQuantity = line.goodQuantity;
      ri.badQuantity = line.badQuantity;
      ri.baseUnitQtyGood = willRestock ? baseQtyGood : 0;
      ri.restockGood = line.restockGood;
      ri.refundAmount = refundAmount;
      returnItems.push(ri);
    }

    if (returnItems.length === 0) {
      throw new BadRequestException('No quantities to return');
    }

    return {
      sale,
      reason: dto.reason ?? null,
      returnItems,
      restockOps,
      damageOps,
      totalRefund,
      restockedValue,
    };
  }

  /**
   * Transactional half of a return: persist the SalesReturn, restock good units
   * (bump Inventory.quantity + a `Return` movement + a `ProductBatch` so
   * returned stock re-enters expiry tracking), log damaged units, and post the
   * refund DEBIT. Runs inside the caller's transaction so an exchange can pair
   * it with a replacement sale atomically.
   *
   * `opts.type`/`replacementSaleId` mark an exchange. `opts.refundOverride` is
   * the cash actually refunded (drives `totalRefundAmount` + the DEBIT) — for an
   * exchange this is the NET `max(0, returned − replacement)`, not the full
   * returned value (which stays on the per-item `refundAmount`s for audit).
   */
  async persistReturnWithinTxn(
    manager: EntityManager,
    actor: AuthUser,
    computed: ComputedReturn,
    opts: {
      type?: string;
      replacementSaleId?: string | null;
      refundOverride?: number;
    } = {},
  ): Promise<SalesReturn> {
    const { sale, returnItems, restockOps, damageOps, restockedValue } =
      computed;
    const refund = opts.refundOverride ?? computed.totalRefund;

    const ret = this.returns.create({
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      branchId: sale.branchId,
      customerUserId: sale.customerUserId,
      totalRefundAmount: refund,
      restockedValue,
      reason: computed.reason,
      status: 'Completed',
      type: opts.type ?? 'Refund',
      replacementSaleId: opts.replacementSaleId ?? null,
      createdByUserId: actor.id,
      items: returnItems,
    });
    const savedReturn = await this.returns.save(ret, manager);

    const invRepo = manager.getRepository(Inventory);
    const movementRepo = manager.getRepository(StockMovement);
    for (const op of restockOps) {
      const inv = await invRepo
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.product_id = :p AND i.branch_id = :b', {
          p: op.productId,
          b: sale.branchId,
        })
        .getOne();

      let balanceAfter: number;
      if (inv) {
        inv.quantity = round3(Number(inv.quantity) + op.baseQtyGood);
        await invRepo.save(inv);
        balanceAfter = Number(inv.quantity);
      } else {
        const created = await invRepo.save(
          invRepo.create({
            productId: op.productId,
            branchId: sale.branchId,
            quantity: op.baseQtyGood,
            lowStockThreshold: 10,
          }),
        );
        balanceAfter = Number(created.quantity);
      }

      await movementRepo.save(
        movementRepo.create({
          productId: op.productId,
          branchId: sale.branchId,
          location: sale.location,
          movementType: 'Return',
          qtyIn: op.baseQtyGood,
          qtyOut: 0,
          balanceAfter,
          refType: 'SalesReturn',
          refId: savedReturn.id,
          notes: `Return ${sale.invoiceNumber}`,
          createdByUserId: actor.id,
        }),
      );

      // Re-enter batch/expiry tracking for the restocked units. This is a pure
      // additive insert — it does NOT touch Inventory.quantity (already bumped
      // above), so there is no double-count. Null expiry is safe (simply
      // excluded from expiry alerts).
      await this.batches.create(
        {
          productId: op.productId,
          branchId: sale.branchId,
          quantity: op.baseQtyGood,
          expiryDate: op.expiryDate,
          batchNo: null,
          notes: `Restocked — ${sale.invoiceNumber}`,
          createdByUserId: actor.id,
        },
        manager,
      );
    }

    // Audit-only log for damaged returns: records the damaged quantity in
    // `qtyIn` without changing sellable stock (balanceAfter is the current,
    // unchanged sellable balance — after any restock write for the product).
    for (const op of damageOps) {
      const inv = await invRepo
        .createQueryBuilder('i')
        .where('i.product_id = :p AND i.branch_id = :b', {
          p: op.productId,
          b: sale.branchId,
        })
        .getOne();
      const balanceAfter = inv ? Number(inv.quantity) : 0;

      await movementRepo.save(
        movementRepo.create({
          productId: op.productId,
          branchId: sale.branchId,
          location: sale.location,
          movementType: 'Damage',
          qtyIn: op.baseQtyBad,
          qtyOut: 0,
          balanceAfter,
          refType: 'SalesReturn',
          refId: savedReturn.id,
          notes: `Damaged return ${sale.invoiceNumber}`,
          createdByUserId: actor.id,
        }),
      );
    }

    if (refund > 0) {
      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId: sale.branchId,
        entryType: LedgerEntryType.DEBIT,
        amount: refund,
        description: `Sales Return — ${sale.invoiceNumber}`,
        referenceNumber: `RET-${savedReturn.id.slice(0, 8).toUpperCase()}`,
        saleId: sale.id,
      });
    }

    return savedReturn;
  }

  async listReturns(
    actor: AuthUser,
    query: ListReturnsQueryDto,
  ): Promise<PaginatedSalesReturns> {
    const { branchId, cashierId } = this.resolveReadScope(
      actor,
      query.branchId,
      query.cashierId,
    );
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.returns.listReturns({
      branchId,
      cashierId,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
      status: query.status,
      page,
      limit,
    });
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /** KPI totals + by-branch/by-cashier/trend breakdowns, role-scoped. */
  async getAnalytics(
    actor: AuthUser,
    query: ReturnsAnalyticsQueryDto,
  ): Promise<ReturnsAnalytics> {
    const { branchId, cashierId } = this.resolveReadScope(
      actor,
      query.branchId,
      query.cashierId,
    );
    const { startDate, endDate } = this.resolveWindow(
      query.startDate,
      query.endDate,
    );
    const opts = { branchId, cashierId, startDate, endDate };
    const [totals, damagedQty, byBranch, byCashier, trend] = await Promise.all([
      this.analytics.totals(opts),
      this.analytics.damagedQty(opts),
      this.analytics.byBranch(opts),
      this.analytics.byCashier(opts),
      this.analytics.trend(opts),
    ]);
    return {
      range: { startDate, endDate },
      totals: { ...totals, damagedQty },
      byBranch,
      byCashier,
      trend,
    };
  }

  /** Default the report window to the last 30 days when unspecified. */
  private resolveWindow(
    startDate?: string,
    endDate?: string,
  ): { startDate: string; endDate: string } {
    const end = endDate ?? new Date().toISOString().slice(0, 10);
    const start =
      startDate ??
      new Date(
        new Date(`${end}T00:00:00Z`).getTime() -
          (ANALYTICS_DEFAULT_DAYS - 1) * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 10);
    if (start > end) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    return { startDate: start, endDate: end };
  }

  private assertBranchAccess(actor: AuthUser, branchId: string): void {
    if (actor.role !== UserRole.ADMIN && actor.branchId !== branchId) {
      // Never leak the existence of sales rung up at other branches.
      throw new NotFoundException('Sale not found');
    }
  }

  /**
   * Read scope for the returns dashboard:
   * - ADMIN     → all branches (optional branch/cashier filter)
   * - MANAGER   → own branch (optional cashier filter within it)
   * - CASHIER   → own branch AND only their own returns (any requested
   *               cashierId is ignored; a foreign branch is rejected)
   */
  private resolveReadScope(
    actor: AuthUser,
    requestedBranchId?: string,
    requestedCashierId?: string,
  ): { branchId: string | null; cashierId: string | null } {
    if (actor.role === UserRole.ADMIN) {
      return {
        branchId: requestedBranchId ?? null,
        cashierId: requestedCashierId ?? null,
      };
    }
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    if (requestedBranchId && requestedBranchId !== actor.branchId) {
      throw new ForbiddenException('Cannot access another branch');
    }
    if (actor.role === UserRole.CASHIER) {
      return { branchId: actor.branchId, cashierId: actor.id };
    }
    return {
      branchId: actor.branchId,
      cashierId: requestedCashierId ?? null,
    };
  }
}
