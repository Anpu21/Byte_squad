import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';

import { Sale } from '@pos/entities/sale.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { ProductsService } from '@products/products.service';
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
import { AccountingService } from '@accounting/accounting.service';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltyWalletService } from '@/modules/loyalty/loyalty-wallet.service';
import type { LoyaltyOwner } from '@/modules/loyalty/types';
import { CreditAccountsService } from '@/modules/credit-accounts/credit-accounts.service';

import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { assertWithinCreditLimit } from '@pos/lib/credit-limit';
import { DiscountType } from '@common/enums/discount.enum';
import { TransactionType } from '@common/enums/transaction.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { UserRole } from '@common/enums/user-roles.enums';
import type {
  CreateSaleResponse,
  CreateSaleLoyaltyResult,
  PosPaymentMethod,
} from '@pos/types';

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
 * Map the POS payment-method union to the legacy `PaymentMethod` enum
 * stored on the Sale row. The shop accepts Cash + Card (PayHere) only, plus
 * the Credit (khata) tender. The `PaymentMethod` DB enum keeps its legacy
 * MOBILE/ONLINE values for historical rows, but new sales only ever map to
 * CASH, CARD, or ONLINE (for Credit). The full breakdown lives on the
 * Payment row.
 */
function mapToLegacyPaymentMethod(method: PosPaymentMethod): PaymentMethod {
  switch (method) {
    case 'Cash':
      return PaymentMethod.CASH;
    case 'Card':
      return PaymentMethod.CARD;
    case 'Credit':
      // The Sale.payment_method column has no Credit value; bucket it into
      // ONLINE so the legacy code paths (which only look for CASH vs
      // not-CASH) keep working. The Payment row carries the full detail.
      return PaymentMethod.ONLINE;
    case 'Exchange':
      // Replacement leg of an exchange (settled by returned goods). No enum
      // value; bucket into ONLINE (not-CASH). Payment row carries the detail.
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
export interface ItemCompute {
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

/** Pre-transaction pricing of an exchange replacement (see computeReplacement). */
export interface ReplacementCompute {
  itemRows: ItemCompute[];
  itemsSubtotal: number;
  taxTotal: number;
  total: number;
}

/**
 * Resolved settlement for the replacement leg's Payment row. `paymentAmount` is
 * the NET upcharge (0 for an even/cheaper swap; the difference for a dearer
 * one). Cash upcharge → `cashAmount = paymentAmount` (lands in the drawer's cash
 * bucket); card upcharge → `cashAmount = 0` so `paymentAmount` surfaces as the
 * card residual in the Z-report.
 */
export interface ReplacementPayment {
  paymentAmount: number;
  cashAmount: number;
  cashTendered: number;
  cashChange: number;
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
    private readonly products: ProductsService,
    private readonly accounting: AccountingService,
    private readonly loyalty: LoyaltyService,
    private readonly loyaltyWallet: LoyaltyWalletService,
    private readonly creditAccounts: CreditAccountsService,
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
  ): Promise<CreateSaleResponse> {
    // ---------------------------------------------------------------
    // 0. Loyalty owner validation — at most one of the two ownership
    //    fields may be set. We check BEFORE opening the transaction so a
    //    bad payload never partially writes anything (and so the
    //    idempotency replay path still gets short-circuited for valid
    //    repeats of an invalid sale).
    // ---------------------------------------------------------------
    if (dto.customerUserId && dto.loyaltyCustomerId) {
      throw new BadRequestException(
        'Provide either customerUserId or loyaltyCustomerId, not both',
      );
    }
    // A credit-account ("khata") sale and a User-credit sale are different
    // ledgers; the customer who owes must be unambiguous.
    if (dto.creditAccountId && dto.customerUserId) {
      throw new BadRequestException(
        'Provide either customerUserId or creditAccountId, not both',
      );
    }

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
    const unitsById = await this.resolveSellableUnits(dto.items);
    const productsById = await this.resolveProducts(dto.items);

    // The cashier UI no longer offers a Retail/Wholesale toggle; every new
    // sale rings at retail. The columns stay on the Sale row for historical
    // reporting (and to keep older 'Wholesale' rows intact).
    const saleType = dto.saleType ?? 'Retail';
    const priceLevel = dto.priceLevel ?? 'Retail';

    // ---------------------------------------------------------------
    // 3. Per-item math
    // ---------------------------------------------------------------
    const itemRows: ItemCompute[] = dto.items.map((item) =>
      computeItem(
        item,
        unitsById,
        productsById,
        priceLevel,
        dto.location ?? 'Shop',
      ),
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
    // 5. Loyalty owner + redemption sizing (BEFORE the tender)
    //
    // Resolve the owner (validated above as at-most-one), then size the
    // redemption read-only so the payable can drop by the points' money
    // value. The actual point debit happens inside the transaction via
    // `redeemForOrder`, which re-caps on the same `itemsSubtotal`; sizing
    // here only decides how much money the customer still owes.
    // ---------------------------------------------------------------
    const loyaltyOwner: LoyaltyOwner | null = dto.customerUserId
      ? { userId: dto.customerUserId }
      : dto.loyaltyCustomerId
        ? { loyaltyCustomerId: dto.loyaltyCustomerId }
        : null;
    const loyaltyOwnerType: 'user' | 'walkIn' | null = dto.customerUserId
      ? 'user'
      : dto.loyaltyCustomerId
        ? 'walkIn'
        : null;

    const redeem = await this.loyaltyWallet.previewRedeemValue({
      owner: loyaltyOwner,
      itemsSubtotal,
      requestedPoints: dto.loyaltyRedeemPoints ?? 0,
    });

    // ---------------------------------------------------------------
    // 6. Multi-tender breakdown — redeemed points settle like a non-cash
    //    tender, so the customer owes `total - redeemValue` in money.
    // ---------------------------------------------------------------
    const tender = this.multiTender.calculate(
      total,
      dto.payment,
      redeem.redeemValue,
    );

    // ---------------------------------------------------------------
    // 7. Transactional write
    // ---------------------------------------------------------------
    const { sale: saved, loyaltyResult } = await this.dataSource.transaction(
      async (manager) => {
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

        // 6b-credit. Validate + lock the khata account BEFORE the sale row so
        // its repayment due date can be stamped on the sale. Enforces ACTIVE +
        // branch + credit limit (or a valid manager override token).
        const creditCtx =
          dto.creditAccountId && tender.creditTaken > 0
            ? await this.creditAccounts.prepareCharge(manager, {
                creditAccountId: dto.creditAccountId,
                actor,
                amount: tender.creditTaken,
                overrideToken: dto.creditOverrideToken,
              })
            : null;

        // 6c. Sale row
        const sale = await this.sales.create(
          {
            branchId,
            cashierId: actor.id,
            customerUserId: dto.customerUserId ?? null,
            loyaltyCustomerId: dto.loyaltyCustomerId ?? null,
            creditAccountId: creditCtx?.account.id ?? null,
            dueDate: creditCtx?.dueDate ?? null,
            creditOverrideByUserId: creditCtx?.overrideByUserId ?? null,
            invoiceNumber,
            transactionNumber: `TXN-${Date.now()}-${randomSuffix()}`,
            type: TransactionType.SALE,
            saleType,
            priceLevel,
            location: dto.location ?? 'Shop',
            subtotal: itemsSubtotal,
            discountAmount: cartDiscount,
            discountType:
              cartDiscountPct > 0
                ? DiscountType.PERCENTAGE
                : DiscountType.FIXED,
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
            loyaltyAmount: tender.loyaltyApplied,
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

        // 6f-credit. Khata account charge (parallel to the User-credit path):
        // append the Credit_Taken row + advance the account balance.
        if (creditCtx) {
          await this.creditAccounts.commitChargeWithManager(manager, {
            context: creditCtx,
            saleId: sale.id,
            invoiceNumber: sale.invoiceNumber,
            amount: tender.creditTaken,
          });
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

        // 6i. Loyalty wallet writes. Stay inside the transaction so an
        // insufficient-balance redeem, award failure, or ledger failure
        // rolls the whole sale back with stock, payment, and accounting.
        const loyaltyResult = await this.applyLoyalty({
          owner: loyaltyOwner,
          ownerType: loyaltyOwnerType,
          sale,
          redeemPoints: redeem.cappedPoints,
          redeemValue: redeem.redeemValue,
          // Earn on the money actually paid (settled minus the points
          // tender) — the customer doesn't earn on the value they redeemed.
          earnBaseAmount: round2(
            Math.max(0, tender.paidAmount - tender.loyaltyApplied),
          ),
          subtotal: itemsSubtotal,
          branchId,
          manager,
        });

        return { sale, loyaltyResult };
      },
    );

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

    return loyaltyResult
      ? Object.assign(saved, { loyalty: loyaltyResult })
      : saved;
  }

  /**
   * Pure, pre-transaction pricing of a replacement basket (the "goods out" leg
   * of an exchange). Reuses the same unit resolution + server-authoritative
   * `computeItem` math as a normal sale, so pricing/tax/base-unit conversion are
   * identical. No cart discount or loyalty — a replacement rings at retail.
   * Runs OUTSIDE any transaction; {@link persistReplacementWithinTxn} writes.
   */
  async computeReplacement(
    items: CreateSaleDto['items'],
    location: string,
  ): Promise<ReplacementCompute> {
    const unitsById = await this.resolveSellableUnits(items);
    const productsById = await this.resolveProducts(items);
    const itemRows = items.map((item) =>
      computeItem(item, unitsById, productsById, 'Retail', location),
    );
    const itemsSubtotal = round2(
      itemRows.reduce((s, i) => s + i.lineSubtotal, 0),
    );
    const taxTotal = round2(itemRows.reduce((s, i) => s + i.lineTaxAmount, 0));
    const total = round2(Math.max(0, itemsSubtotal + taxTotal));
    return { itemRows, itemsSubtotal, taxTotal, total };
  }

  /**
   * Transactional half of the replacement leg: pessimistic stock decrement,
   * year-sequential invoice, Sale + SaleItems + an `'Exchange'` Payment row, a
   * `'Sale'` stock movement per line, and a ledger CREDIT of the NET upcharge
   * only. Runs inside the exchange's transaction so it commits atomically with
   * the return leg. No multi-tender, loyalty, khata, or idempotency here — the
   * ExchangeService owns those concerns.
   *
   * The Sale is marked fully paid (`total`, settled by the returned goods plus
   * any upcharge) and carries `exchangeReturnId`. The ledger CREDIT is only the
   * net cash in (`payment.paymentAmount`): the returned value was already booked
   * on the original sale, so crediting the full replacement total would
   * double-count revenue.
   */
  async persistReplacementWithinTxn(
    manager: EntityManager,
    actor: ActorPayload,
    params: {
      branchId: string;
      location: string;
      customerUserId: string | null;
      exchangeReturnId: string;
      replacement: ReplacementCompute;
      payment: ReplacementPayment;
    },
  ): Promise<Sale> {
    const { branchId, location, replacement, payment } = params;

    const postDeductQty = await this.decrementInventoryWithLock(
      manager,
      branchId,
      replacement.itemRows,
    );

    const invoiceNumber = await this.invoiceNumbers.next(
      new Date().getFullYear(),
      manager,
    );

    const sale = await this.sales.create(
      {
        branchId,
        cashierId: actor.id,
        customerUserId: params.customerUserId,
        loyaltyCustomerId: null,
        creditAccountId: null,
        dueDate: null,
        creditOverrideByUserId: null,
        exchangeReturnId: params.exchangeReturnId,
        invoiceNumber,
        transactionNumber: `TXN-${Date.now()}-${randomSuffix()}`,
        type: TransactionType.SALE,
        saleType: 'Retail',
        priceLevel: 'Retail',
        location,
        subtotal: replacement.itemsSubtotal,
        discountAmount: 0,
        discountType: DiscountType.FIXED,
        taxAmount: replacement.taxTotal,
        total: replacement.total,
        // Fully settled by the returned goods (+ any upcharge collected below).
        paidAmount: replacement.total,
        balanceDue: 0,
        paymentStatus: 'Paid',
        status: 'Active',
        paymentMethod: mapToLegacyPaymentMethod('Exchange'),
      },
      manager,
    );

    await this.saleItems.createMany(
      replacement.itemRows.map((r) => ({ ...r, saleId: sale.id })),
      manager,
    );

    await this.payments.create(
      {
        saleId: sale.id,
        receiptNo: `RCPT-${sale.id.slice(0, 8)}`,
        paymentMethod: 'Exchange',
        paymentAmount: payment.paymentAmount,
        invoiceTotal: replacement.total,
        cashTendered: payment.cashTendered,
        cashAmount: payment.cashAmount,
        cashChange: payment.cashChange,
        chequeAmount: 0,
        bankTransferAmount: 0,
        creditAmount: 0,
        loyaltyAmount: 0,
        keepBalance: false,
        chequeNo: null,
        chequeDate: null,
        chequeBank: null,
        chequeBranch: null,
        chequeDeliveredBy: null,
        chequeRef: null,
        bankRef: null,
        status: 'Active',
      },
      manager,
    );

    await this.recordStockMovements(
      manager,
      sale,
      actor.id,
      branchId,
      replacement.itemRows,
      postDeductQty,
    );

    // Ledger CREDIT = the NET upcharge only (the difference the customer paid).
    // For an even/cheaper swap this is 0 (no entry) — the return leg posts the
    // DEBIT for a cheaper swap. Crediting the full replacement total would
    // double-count revenue already booked on the original sale.
    if (payment.paymentAmount > 0) {
      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: payment.paymentAmount,
        description: `Exchange replacement — ${sale.invoiceNumber}`,
        referenceNumber: sale.invoiceNumber,
        saleId: sale.id,
      });
    }

    return sale;
  }

  /**
   * Wallet-side bookkeeping for the just-persisted sale. Returns the
   * loyalty summary that the controller appends to the response, or
   * null when the cashier did not attach any loyalty owner.
   *
   * `redeemPoints` arrives already server-capped by `previewRedeemValue`
   * (the same figure that reduced the payable up front). `redeemForOrder`
   * re-validates the cap inside the transaction and commits the debit;
   * if it ends up redeeming a different count than we booked the payable
   * against (e.g. the balance moved between sizing and the txn), we roll
   * back rather than mis-bill. The earn base is the money actually paid
   * (`earnBaseAmount`), so the customer does NOT earn on redeemed value.
   */
  private async applyLoyalty(params: {
    owner: LoyaltyOwner | null;
    ownerType: 'user' | 'walkIn' | null;
    sale: Sale;
    redeemPoints: number;
    redeemValue: number;
    earnBaseAmount: number;
    subtotal: number;
    branchId: string;
    manager: EntityManager;
  }): Promise<CreateSaleLoyaltyResult | null> {
    if (!params.owner || !params.ownerType) return null;

    const redeemed =
      params.redeemPoints > 0
        ? await this.loyaltyWallet.redeemForOrder({
            owner: params.owner,
            orderId: params.sale.id,
            orderCode: params.sale.invoiceNumber,
            subtotal: params.subtotal,
            requestedPoints: params.redeemPoints,
            branchId: params.branchId,
            manager: params.manager,
          })
        : 0;

    if (redeemed !== params.redeemPoints) {
      throw new ConflictException(
        'Loyalty balance changed during checkout — please retry',
      );
    }

    const earned = await this.loyaltyWallet.awardForOrder({
      owner: params.owner,
      orderId: params.sale.id,
      orderCode: params.sale.invoiceNumber,
      paidAmount: params.earnBaseAmount,
      branchId: params.branchId,
      manager: params.manager,
    });

    const account = await this.loyalty.getOrCreateAccount(
      params.owner,
      params.manager,
    );

    return {
      ownerType: params.ownerType,
      earned,
      redeemed,
      redeemValue: params.redeemValue,
      newBalance: account.pointsBalance,
    };
  }

  // -------------------------------------------------------------------
  // Helpers — split out so the orchestrator stays readable
  // -------------------------------------------------------------------

  /**
   * Resolve any `unitId` references on the line items in one round-trip and
   * reject if any unit belongs to a different product than the line declared.
   */
  private async resolveSellableUnits(
    items: CreateSaleDto['items'],
  ): Promise<Map<string, ProductSellableUnit>> {
    const unitIds = Array.from(
      new Set(
        items
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
    for (const item of items) {
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

  private async resolveProducts(
    items: CreateSaleDto['items'],
  ): Promise<Map<string, Product>> {
    const productIds = Array.from(
      new Set(items.map((item) => item.productId)),
    );
    const rows = await this.products.findActiveByIds(productIds);
    const byId = new Map(rows.map((product) => [product.id, product]));
    for (const productId of productIds) {
      if (!byId.has(productId)) {
        throw new NotFoundException(`Product ${productId} not found`);
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

    assertWithinCreditLimit(
      user.creditLimit === null ? null : Number(user.creditLimit),
      runningBalance,
      tender.creditTaken,
    );

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
 * `unitPrice` is server-derived from the selected sellable unit. For base
 * lines it comes from `Product.sellingPrice`; for pack rows it comes from
 * `ProductSellableUnit.sellingPrice`. The client-submitted price is only a
 * stale/tamper check and is never used as the pricing source.
 */
function computeItem(
  item: CreateSaleDto['items'][number],
  unitsById: Map<string, ProductSellableUnit>,
  productsById: Map<string, Product>,
  priceLevel: 'Retail' | 'Wholesale',
  defaultLocation: string,
): ItemCompute {
  const qty = Number(item.quantity);
  const free = Number(item.free ?? 0);
  const chargedQty = Math.max(0, qty - free);
  const disc = Number(item.discountPercentage ?? 0);
  const taxRate = Number(item.taxRate ?? 0);

  const unit = item.unitId ? unitsById.get(item.unitId) : null;
  const conversion = unit ? Number(unit.conversionToBase) : 1;
  const product = productsById.get(item.productId);
  if (!product) {
    throw new NotFoundException(`Product ${item.productId} not found`);
  }
  const unitPrice = unit
    ? Number(unit.sellingPrice)
    : Number(product.sellingPrice);
  if (round2(Number(item.unitPrice)) !== round2(unitPrice)) {
    throw new ConflictException(
      `Unit price changed for product ${item.productId}; refresh the cart and try again`,
    );
  }

  const lineSubtotal = round2(chargedQty * unitPrice * (1 - disc / 100));
  const lineDiscountAmount = round2(chargedQty * unitPrice * (disc / 100));
  const lineTaxAmount = round2(lineSubtotal * (taxRate / 100));
  const lineTotal = round2(lineSubtotal + lineTaxAmount);

  const baseUnitQty = round3(qty * conversion);
  if (product.baseUnit === 'unit' && !Number.isInteger(baseUnitQty)) {
    throw new BadRequestException(
      `Product ${item.productId} is sold in whole units; fractional quantity ${baseUnitQty} is not allowed`,
    );
  }

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
