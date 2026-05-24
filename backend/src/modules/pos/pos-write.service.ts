import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';

import { Sale } from '@pos/entities/sale.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { User } from '@users/entities/user.entity';

import { CreateSaleDto } from '@pos/dto/create-sale.dto';
import { PosRepository } from '@pos/pos.repository';
import { SaleRepository } from '@pos/sale.repository';
import { SaleItemRepository } from '@pos/sale-item.repository';
import { PaymentRepository } from '@pos/payment.repository';
import { CreditTransactionRepository } from '@pos/credit-transaction.repository';
import { StockMovementRepository } from '@pos/stock-movement.repository';
import { InvoiceNumberService } from '@pos/services/invoice-number.service';
import { MultiTenderCalculatorService } from '@pos/services/multi-tender-calculator.service';
import { AccountingRepository } from '@accounting/accounting.repository';

import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { TransactionType } from '@common/enums/transaction.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { UserRole } from '@common/enums/user-roles.enums';
import type { PosPaymentMethod } from '@pos/types';

/**
 * Shape of `@CurrentUser()` payloads injected into POS endpoints. Mirrors the
 * decorator's inline type without leaking the decorator's private interface
 * into this file.
 */
export interface ActorPayload {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Match the `decimal(12, 3)` scale on inventory.quantity and the
// sale_items.base_unit_qty column. Prevents float drift like
// `10 - 0.005 = 9.994999999999999` from persisting to the DB.
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Map the Shanel payment-method union to the legacy `PaymentMethod` enum
 * stored on the Sale row. The enum only has CASH/CARD/MOBILE/ONLINE; the
 * full multi-tender breakdown is captured on the Payment row. This bridge
 * keeps the legacy `payment_method` column populated until the Phase-6
 * cleanup drops it.
 */
function mapToLegacyPaymentMethod(method: PosPaymentMethod): PaymentMethod {
  switch (method) {
    case 'Cash':
      return PaymentMethod.CASH;
    case 'Card':
      return PaymentMethod.CARD;
    case 'Mobile':
      return PaymentMethod.MOBILE;
    case 'Cheque':
    case 'Bank':
    case 'Credit':
      // The Sale.payment_method column doesn't have these; bucket them all
      // into ONLINE so the legacy code paths (which only look for CASH vs
      // not-CASH) keep working. The Payment row carries the full detail.
      return PaymentMethod.ONLINE;
    default: {
      // Exhaustiveness guard: when a new tender is added to the
      // PosPaymentMethod union, TypeScript will flag this branch and
      // refuse to compile until a matching `case` is added above.
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/**
 * Internal shape produced by the per-item math step. We keep the
 * computed-once values around so the stock-decrement pass and the
 * SaleItem write don't need to recompute them.
 */
interface ItemCompute {
  productId: string;
  unitId: string | null;
  quantity: number;
  free: number;
  baseUnitQty: number;
  unitPrice: number;
  discountAmount: number;
  discountType: DiscountType;
  lineDiscountPercentage: number;
  lineSubtotal: number;
  lineTaxRate: number;
  lineTaxAmount: number;
  lineTotal: number;
  priceLevelUsed: 'Retail' | 'Wholesale';
  locationTakenFrom: string;
}

/**
 * PosWriteService — owns the `POST /pos/sales` checkout orchestration.
 *
 * Split from `pos.service.ts` (which is at ~640 lines of read endpoints and
 * dashboards) so the write path stays inside the size budget from Rules.md
 * §17. Both services share the same module and ActorPayload contract.
 */
@Injectable()
export class PosWriteService {
  private readonly logger = new Logger(PosWriteService.name);

  constructor(
    private readonly pos: PosRepository,
    private readonly sales: SaleRepository,
    private readonly saleItems: SaleItemRepository,
    private readonly payments: PaymentRepository,
    private readonly creditTransactions: CreditTransactionRepository,
    private readonly stockMovements: StockMovementRepository,
    private readonly invoiceNumbers: InvoiceNumberService,
    private readonly multiTender: MultiTenderCalculatorService,
    private readonly accounting: AccountingRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Faithful port of Shanel `postSalesData` adapted for LedgerPro's stack.
   *
   * Flow:
   *  1. Replay short-circuit when an idempotency key matches a previous sale.
   *  2. Resolve sellable units (used by both the base-qty conversion and the
   *     server-side validation that the unit belongs to the line's product).
   *  3. Per-item math: line subtotal, line tax, line total, base-unit qty.
   *  4. Sale-level totals: items subtotal, cart discount, tax total, total.
   *  5. Multi-tender breakdown via `MultiTenderCalculatorService`.
   *  6. Single transaction:
   *       a. Pessimistic-lock + decrement inventory per item (stock check).
   *       b. Reserve the year-sequential invoice number.
   *       c. Insert Sale row with multi-tender summary fields.
   *       d. Insert SaleItem rows.
   *       e. Insert Payment row with multi-tender detail + cheque metadata.
   *       f. When customer + credit involvement: insert credit_transactions
   *          row(s) and update User.currentBalance running balance.
   *       g. Insert stock_movements row per item.
   *       h. Insert ledger entry for the sale total.
   *  7. Insert the idempotency key (race-safe via QueryFailedError catch).
   *
   * @throws ConflictException when stock is insufficient or a sellable unit
   *   doesn't belong to its product.
   * @throws BadRequestException (via the calculator) when overpayment lacks
   *   a `keepBalance=true` flag.
   * @throws NotFoundException when the customer attached to a credit sale
   *   doesn't exist.
   */
  async createSale(
    actor: ActorPayload,
    dto: CreateSaleDto,
    idempotencyKey?: string,
  ): Promise<Sale> {
    // ---------------------------------------------------------------
    // 1. Idempotency replay
    //
    // Scope is (cashier_id, key). The unique index on the table is on the
    // same pair, so two different cashiers can independently submit the
    // same X-Idempotency-Key without colliding. Replay fires only when the
    // SAME cashier resubmits the same key. See `IdempotencyKey` entity for
    // the constraint.
    // ---------------------------------------------------------------
    const trimmedKey = idempotencyKey?.trim();
    if (trimmedKey) {
      const existing = await this.pos.findIdempotencyKey(actor.id, trimmedKey);
      if (existing) {
        this.logger.log(
          `Idempotency replay: cashier=${actor.id} key=${trimmedKey} → sale=${existing.saleId}`,
        );
        const replay = await this.sales.findOneById(existing.saleId);
        if (!replay) {
          throw new NotFoundException('Original sale no longer exists');
        }
        return replay;
      }
    }

    const branchId = actor.branchId;
    if (!branchId) {
      throw new ConflictException(
        'Cashier must be assigned to a branch to create a sale',
      );
    }

    // ---------------------------------------------------------------
    // 2. Resolve sellable units
    // ---------------------------------------------------------------
    const unitsById = await this.resolveSellableUnits(dto);

    // ---------------------------------------------------------------
    // 3. Per-item math
    // ---------------------------------------------------------------
    const itemRows: ItemCompute[] = dto.items.map((item) =>
      computeItem(item, unitsById, dto.priceLevel, dto.location ?? 'Shop'),
    );

    // ---------------------------------------------------------------
    // 4. Cart-level totals
    // ---------------------------------------------------------------
    const itemsSubtotal = round2(
      itemRows.reduce((s, i) => s + i.lineSubtotal, 0),
    );
    const cartDiscountPct = Number(dto.cartDiscountPercentage ?? 0);
    const cartDiscount = round2(
      cartDiscountPct > 0
        ? itemsSubtotal * (cartDiscountPct / 100)
        : Number(dto.cartDiscountAmount ?? 0),
    );
    const taxTotal = round2(itemRows.reduce((s, i) => s + i.lineTaxAmount, 0));
    const total = round2(Math.max(0, itemsSubtotal - cartDiscount + taxTotal));

    // ---------------------------------------------------------------
    // 5. Multi-tender breakdown
    // ---------------------------------------------------------------
    const tender = this.multiTender.calculate(total, dto.payment);

    // ---------------------------------------------------------------
    // 6. Transactional write
    // ---------------------------------------------------------------
    const saved = await this.dataSource.transaction(async (manager) => {
      // 6a. Stock check + decrement (pessimistic lock per row). Returns the
      // post-deduct quantity for each product so recordStockMovements can
      // log balanceAfter without an extra round-trip per item.
      const postDeductQty = await this.decrementInventoryWithLock(
        manager,
        branchId,
        itemRows,
      );

      // 6b. Invoice number (atomic year-sequential via SELECT FOR UPDATE)
      const invoiceNumber = await this.invoiceNumbers.next(
        new Date().getFullYear(),
        manager,
      );

      // 6c. Sale row
      const sale = await this.sales.create(
        {
          branchId,
          cashierId: actor.id,
          customerUserId: dto.customerUserId ?? null,
          invoiceNumber,
          transactionNumber: `TXN-${Date.now()}-${randomSuffix()}`,
          type: TransactionType.SALE,
          saleType: dto.saleType,
          priceLevel: dto.priceLevel,
          location: dto.location ?? 'Shop',
          subtotal: itemsSubtotal,
          discountAmount: cartDiscount,
          discountType:
            cartDiscountPct > 0 ? DiscountType.PERCENTAGE : DiscountType.FIXED,
          taxAmount: taxTotal,
          total,
          paidAmount: tender.paidAmount,
          balanceDue: tender.balanceDue,
          paymentStatus: tender.paymentStatus,
          status: 'Active',
          // Legacy single-tender column — kept populated for back-compat
          // until Phase 6+ drops it. Multi-tender detail lives on Payment.
          paymentMethod: mapToLegacyPaymentMethod(dto.payment.paymentMethod),
        },
        manager,
      );

      // 6d. SaleItems
      await this.saleItems.createMany(
        itemRows.map((r) => ({ ...r, saleId: sale.id })),
        manager,
      );

      // 6e. Payment row (one row, multi-tender breakdown)
      await this.payments.create(
        {
          saleId: sale.id,
          receiptNo: `RCPT-${sale.id.slice(0, 8)}`,
          paymentMethod: dto.payment.paymentMethod,
          paymentAmount: tender.paymentAmount,
          invoiceTotal: total,
          cashTendered: Number(dto.payment.cashTendered ?? 0),
          cashAmount: Number(dto.payment.cashAmount ?? 0),
          cashChange: tender.cashChange,
          chequeAmount: Number(dto.payment.chequeAmount ?? 0),
          bankTransferAmount: Number(dto.payment.bankTransferAmount ?? 0),
          creditAmount: tender.creditTaken,
          keepBalance: dto.payment.keepBalance ?? false,
          chequeNo: dto.payment.chequeNo ?? null,
          chequeDate: dto.payment.chequeDate
            ? new Date(dto.payment.chequeDate)
            : null,
          chequeBank: dto.payment.chequeBank ?? null,
          chequeBranch: dto.payment.chequeBranch ?? null,
          chequeDeliveredBy: dto.payment.chequeDeliveredBy ?? null,
          chequeRef: dto.payment.chequeRef ?? null,
          bankRef: dto.payment.bankRef ?? null,
          status: 'Active',
        },
        manager,
      );

      // 6f. Credit transactions + customer balance
      if (
        dto.customerUserId &&
        (tender.creditTaken > 0 || tender.overpayKeptBalance > 0)
      ) {
        await this.applyCreditChanges(
          manager,
          sale,
          dto.customerUserId,
          tender,
        );
      }

      // 6g. Stock movements (one row per item) — reads balanceAfter from
      // the post-deduct map produced in step 6a, so no per-item re-query.
      await this.recordStockMovements(
        manager,
        sale,
        actor.id,
        branchId,
        itemRows,
        postDeductQty,
      );

      // 6h. Ledger entry
      if (total > 0) {
        await this.accounting.createLedgerEntryWithManager(manager, {
          branchId,
          entryType: LedgerEntryType.CREDIT,
          amount: total,
          description: `POS Sale — ${sale.invoiceNumber}`,
          referenceNumber: sale.invoiceNumber,
          saleId: sale.id,
        });
      }

      return sale;
    });

    // ---------------------------------------------------------------
    // 7. Idempotency key insert (race-safe via QueryFailedError catch)
    // ---------------------------------------------------------------
    if (trimmedKey) {
      try {
        await this.pos.insertIdempotencyKey({
          key: trimmedKey,
          cashierId: actor.id,
          saleId: saved.id,
        });
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const winning = await this.pos.findIdempotencyKey(
            actor.id,
            trimmedKey,
          );
          if (winning && winning.saleId !== saved.id) {
            this.logger.warn(
              `Idempotency race: cashier=${actor.id} key=${trimmedKey} kept=${winning.saleId} discarded=${saved.id}`,
            );
            const replay = await this.sales.findOneById(winning.saleId);
            if (replay) return replay;
          }
        }
        throw err;
      }
    }

    return saved;
  }

  // -------------------------------------------------------------------
  // Helpers — split out so the orchestrator stays readable
  // -------------------------------------------------------------------

  /**
   * Resolve any `unitId` references on the line items in one round-trip and
   * reject if any unit belongs to a different product than the line declared.
   */
  private async resolveSellableUnits(
    dto: CreateSaleDto,
  ): Promise<Map<string, ProductSellableUnit>> {
    const unitIds = Array.from(
      new Set(
        dto.items
          .map((i) => i.unitId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    );
    if (unitIds.length === 0) {
      return new Map();
    }
    const rows = await this.dataSource
      .getRepository(ProductSellableUnit)
      .findByIds(unitIds);
    const byId = new Map(rows.map((u) => [u.id, u]));
    // Validate ownership: every item that supplied a unitId must reference
    // a unit that belongs to its productId.
    for (const item of dto.items) {
      if (!item.unitId) continue;
      const unit = byId.get(item.unitId);
      if (!unit) {
        throw new NotFoundException(`Sellable unit ${item.unitId} not found`);
      }
      if (unit.productId !== item.productId) {
        throw new ConflictException(
          `Sellable unit ${item.unitId} does not belong to product ${item.productId}`,
        );
      }
    }
    return byId;
  }

  /**
   * Locks every inventory row touched by the sale via `SELECT ... FOR UPDATE`,
   * verifies sufficient quantity, and writes the decrement. Returns a map of
   * productId → post-deduct quantity so the audit-log helper
   * (`recordStockMovements`) can fill `balanceAfter` without re-querying
   * inventory per item — that re-query was adding N round-trips to the
   * hot transaction.
   *
   * Throws ConflictException with a row-specific message if any line is
   * unstocked or under-stocked.
   */
  private async decrementInventoryWithLock(
    manager: EntityManager,
    branchId: string,
    items: ItemCompute[],
  ): Promise<Map<string, number>> {
    const invRepo = manager.getRepository(Inventory);
    const postDeductQty = new Map<string, number>();
    for (const it of items) {
      const inv = await invRepo
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.product_id = :p AND i.branch_id = :b', {
          p: it.productId,
          b: branchId,
        })
        .getOne();
      if (!inv) {
        throw new ConflictException(
          `Product ${it.productId} is not stocked at this branch`,
        );
      }
      const available = Number(inv.quantity);
      if (available < it.baseUnitQty) {
        throw new ConflictException(
          `Insufficient stock for product ${it.productId}: only ${available} available (requested ${it.baseUnitQty})`,
        );
      }
      const remaining = round3(available - it.baseUnitQty);
      inv.quantity = remaining;
      await invRepo.save(inv);
      postDeductQty.set(it.productId, remaining);
    }
    return postDeductQty;
  }

  /**
   * Apply the credit-side bookkeeping for a sale that touched customer credit:
   * appends to `credit_transactions` and updates the user's running balance.
   * Called only when there is a customerUserId AND tender.creditTaken or
   * tender.overpayKeptBalance is positive.
   */
  private async applyCreditChanges(
    manager: EntityManager,
    sale: Sale,
    customerUserId: string,
    tender: {
      creditTaken: number;
      overpayKeptBalance: number;
    },
  ): Promise<void> {
    const user = await manager
      .getRepository(User)
      .findOne({ where: { id: customerUserId } });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }
    let runningBalance = Number(user.currentBalance);

    if (tender.creditTaken > 0) {
      runningBalance = round2(runningBalance + tender.creditTaken);
      await this.creditTransactions.create(
        {
          userId: user.id,
          saleId: sale.id,
          transactionType: 'Credit_Taken',
          amount: tender.creditTaken,
          runningBalance,
          referenceNo: `CR-${sale.invoiceNumber}`,
          notes: `Credit taken for invoice ${sale.invoiceNumber}`,
        },
        manager,
      );
    }
    if (tender.overpayKeptBalance > 0) {
      runningBalance = round2(runningBalance - tender.overpayKeptBalance);
      await this.creditTransactions.create(
        {
          userId: user.id,
          saleId: sale.id,
          transactionType: 'Credit_Paid',
          amount: tender.overpayKeptBalance,
          runningBalance,
          referenceNo: `OVERPAY-${sale.invoiceNumber}`,
          notes: `Overpayment from ${sale.invoiceNumber} kept as customer balance`,
        },
        manager,
      );
    }
    await manager
      .getRepository(User)
      .update(user.id, { currentBalance: runningBalance });
  }

  /**
   * Append a `stock_movements` row per line item with `qtyOut = baseUnitQty`
   * and the post-deduction balance. Reads `balanceAfter` from the map
   * produced by `decrementInventoryWithLock` — avoids the N extra
   * `findOne` round-trips per checkout that the previous implementation
   * paid inside the hot transaction.
   */
  private async recordStockMovements(
    manager: EntityManager,
    sale: Sale,
    actorId: string,
    branchId: string,
    items: ItemCompute[],
    postDeductQty: Map<string, number>,
  ): Promise<void> {
    for (const it of items) {
      await this.stockMovements.create(
        {
          productId: it.productId,
          branchId,
          location: it.locationTakenFrom,
          movementType: 'Sale',
          qtyIn: 0,
          qtyOut: it.baseUnitQty,
          balanceAfter: postDeductQty.get(it.productId) ?? 0,
          refType: 'Sale',
          refId: sale.id,
          notes: `Sale ${sale.invoiceNumber}`,
          createdByUserId: actorId,
        },
        manager,
      );
    }
  }
}

/**
 * Per-item math, extracted so the orchestrator's `.map` step stays short.
 * Mirrors the frontend `lib/line-total.ts` exactly so server and client
 * agree on subtotal/tax/total figures.
 *
 * `unitPrice` is the price per BASE unit (e.g. Rs 200 for a kg of carrots),
 * regardless of which sellable unit the cashier picked. The picked-unit
 * price is `unitPrice * conversionFactor`, so a kg-stocked carrot sold in
 * grams (conversionFactor = 0.001) bills out at Rs 0.2/g. Discrete or
 * base-unit lines have conversionFactor = 1 and the formula collapses to
 * the original `chargedQty * unitPrice` shape.
 */
function computeItem(
  item: CreateSaleDto['items'][number],
  unitsById: Map<string, ProductSellableUnit>,
  priceLevel: 'Retail' | 'Wholesale',
  defaultLocation: string,
): ItemCompute {
  const qty = Number(item.quantity);
  const free = Number(item.free ?? 0);
  const chargedQty = Math.max(0, qty - free);
  const unitPrice = Number(item.unitPrice);
  const disc = Number(item.discountPercentage ?? 0);
  const taxRate = Number(item.taxRate ?? 0);

  const unit = item.unitId ? unitsById.get(item.unitId) : null;
  const conversion = unit ? Number(unit.conversionToBase) : 1;
  const grossPerUnit = unitPrice * conversion;

  const lineSubtotal = round2(chargedQty * grossPerUnit * (1 - disc / 100));
  const lineDiscountAmount = round2(chargedQty * grossPerUnit * (disc / 100));
  const lineTaxAmount = round2(lineSubtotal * (taxRate / 100));
  const lineTotal = round2(lineSubtotal + lineTaxAmount);

  const baseUnitQty = round3(qty * conversion);

  return {
    productId: item.productId,
    unitId: item.unitId ?? null,
    quantity: qty,
    free,
    baseUnitQty,
    unitPrice,
    discountAmount: lineDiscountAmount,
    discountType: disc > 0 ? DiscountType.PERCENTAGE : DiscountType.NONE,
    lineDiscountPercentage: disc,
    lineSubtotal,
    lineTaxRate: taxRate,
    lineTaxAmount,
    lineTotal,
    priceLevelUsed: priceLevel,
    locationTakenFrom: defaultLocation,
  };
}
