import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entities/user.entity';
import { DiscountScheme } from '@pos/entities/discount-scheme.entity';
import { PosShift } from '@pos/entities/pos-shift.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { CreditTransaction } from '@pos/entities/credit-transaction.entity';
import { ReceivablesService } from '@pos/receivables.service';
import { JournalVoucher } from '@/modules/accounting-core/entities/journal-voucher.entity';
import { JournalVouchersService } from '@/modules/accounting-core/journal-vouchers.service';
import { FiscalPeriodsService } from '@/modules/accounting-periods/fiscal-periods.service';
import { AccountsRepository } from '@/modules/accounting-core/accounts.repository';
import { ACCOUNT_CODES } from '@/modules/accounting-core/types/account-code.type';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';

export interface PosAccountingSeedContext {
  admin: User;
  mainBranch: Branch;
  mainManager: User;
  cashier1: User;
  /** Seeded customer-role users (credit sales attach to the first + last). */
  customers: User[];
  products: Product[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Demo data for the Phase 2–4 roadmap features: discount schemes, a
 * closed drawer shift (Z-report history), customer credit sales with a
 * real FIFO repayment (receivables + ageing + statement), two balanced
 * journal vouchers, and one locked fiscal period.
 *
 * Repayments and vouchers drive the real services so ledger postings,
 * document numbering, and FIFO settlement land exactly as production
 * would; schemes / the shift snapshot / historical credit sales are
 * plain rows with no side effects. Each section is idempotent via a
 * count-check on its own table.
 */
@Injectable()
export class PosAccountingSeedService {
  private readonly logger = new Logger(PosAccountingSeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly receivables: ReceivablesService,
    private readonly journals: JournalVouchersService,
    private readonly fiscalPeriods: FiscalPeriodsService,
    private readonly accounts: AccountsRepository,
  ) {}

  async seed(ctx: PosAccountingSeedContext): Promise<void> {
    await this.seedDiscountSchemes(ctx);
    await this.seedClosedShift(ctx);
    await this.seedReceivables(ctx);
    await this.seedJournalVouchers(ctx);
    await this.seedPeriodLock(ctx);
  }

  // ── Discount schemes ───────────────────────────────────

  private async seedDiscountSchemes(
    ctx: PosAccountingSeedContext,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(DiscountScheme);
    if ((await repo.count()) > 0) return;

    const picks = ctx.products.filter((p) => p.isActive && p.discountAllowed);
    if (picks.length < 4) {
      this.logger.warn('Discount-scheme seed skipped — not enough products.');
      return;
    }
    const today = new Date();
    const day = (offset: number) =>
      toIsoDate(new Date(today.getTime() + offset * DAY_MS));

    await repo.save([
      repo.create({
        name: `Bulk deal: ${picks[0].name} (3+)`,
        branchId: null, // storewide
        scope: 'Product',
        productId: picks[0].id,
        category: null,
        minQty: 3,
        discountPercentage: 10,
        startDate: day(-7),
        endDate: day(30),
        isActive: true,
        createdByUserId: ctx.admin.id,
      }),
      repo.create({
        name: `${picks[1].category} week`,
        branchId: ctx.mainBranch.id,
        scope: 'Category',
        productId: null,
        category: picks[1].category,
        minQty: 0,
        discountPercentage: 5,
        startDate: day(-2),
        endDate: day(10),
        isActive: true,
        createdByUserId: ctx.mainManager.id,
      }),
      repo.create({
        name: `Flash sale: ${picks[2].name}`,
        branchId: ctx.mainBranch.id,
        scope: 'Product',
        productId: picks[2].id,
        category: null,
        minQty: 1,
        discountPercentage: 15,
        startDate: day(0),
        endDate: day(2),
        isActive: true,
        createdByUserId: ctx.mainManager.id,
      }),
      repo.create({
        name: `Last month's ${picks[3].category} promo (paused)`,
        branchId: null,
        scope: 'Category',
        productId: null,
        category: picks[3].category,
        minQty: 0,
        discountPercentage: 8,
        startDate: day(-40),
        endDate: day(-10),
        isActive: false,
        createdByUserId: ctx.admin.id,
      }),
    ]);
    this.logger.log('Discount schemes seeded (4 rules).');
  }

  // ── Closed drawer shift (Z-report history) ─────────────

  private async seedClosedShift(ctx: PosAccountingSeedContext): Promise<void> {
    const repo = this.dataSource.getRepository(PosShift);
    if ((await repo.count()) > 0) return;

    const yesterday = new Date(Date.now() - DAY_MS);
    const openedAt = new Date(yesterday);
    openedAt.setHours(8, 0, 0, 0);
    const closedAt = new Date(yesterday);
    closedAt.setHours(17, 30, 0, 0);

    // Tender totals sum to salesTotal; expected cash reconciles to a
    // believable LKR 50.50 shortfall so the over/short pill lights up.
    const openingFloat = 5000;
    const totalCash = 42350.5;
    const refundsTotal = 1200;
    const expectedCash = round2(openingFloat + totalCash - refundsTotal);
    const countedCash = 46100;

    await repo.save(
      repo.create({
        branchId: ctx.mainBranch.id,
        cashierId: ctx.cashier1.id,
        status: 'Closed',
        openedAt,
        closedAt,
        openingFloat,
        countedCash,
        expectedCash,
        overShort: round2(countedCash - expectedCash),
        totalCash,
        totalCheque: 6000,
        totalBank: 12400,
        totalCredit: 3500,
        totalElectronic: 8200,
        salesCount: 37,
        salesTotal: round2(42350.5 + 6000 + 12400 + 3500 + 8200),
        refundsTotal,
        notes: 'Demo day-end close — counted LKR 50.50 short.',
      }),
    );
    this.logger.log('Closed drawer shift seeded (yesterday, main branch).');
  }

  // ── Customer credit + receivables ──────────────────────

  private async seedReceivables(ctx: PosAccountingSeedContext): Promise<void> {
    const creditRepo = this.dataSource.getRepository(CreditTransaction);
    if ((await creditRepo.count()) > 0) return;
    const [ayesha] = ctx.customers;
    const dinesh = ctx.customers[ctx.customers.length - 1];
    if (!ayesha || !dinesh || ayesha.id === dinesh.id) {
      this.logger.warn('Receivables seed skipped — need 2 customer users.');
      return;
    }

    // Ayesha: three fully-on-credit sales spread across the ageing
    // buckets (90+, 31–60, 0–30), then a real FIFO repayment below.
    const ayeshaSales = [
      { daysAgo: 95, productIndex: 0, quantity: 6 },
      { daysAgo: 50, productIndex: 1, quantity: 9 },
      { daysAgo: 12, productIndex: 2, quantity: 4 },
    ];
    let running = 0;
    for (const [index, spec] of ayeshaSales.entries()) {
      const sale = await this.createCreditSale(ctx, {
        customer: ayesha,
        index: index + 1,
        daysAgo: spec.daysAgo,
        productIndex: spec.productIndex,
        quantity: spec.quantity,
        creditPortion: 1, // whole bill on credit
      });
      running = round2(running + sale.dueAmount);
      await this.recordCreditTaken(
        ayesha,
        sale,
        sale.dueAmount,
        running,
        spec.daysAgo,
      );
    }
    await this.dataSource.getRepository(User).update(ayesha.id, {
      currentBalance: running,
      creditLimit: 50000,
    });

    // Dinesh: one half-paid bill (Partial) and no credit limit set.
    const dineshSale = await this.createCreditSale(ctx, {
      customer: dinesh,
      index: 4,
      daysAgo: 25,
      productIndex: 3,
      quantity: 8,
      creditPortion: 0.5,
    });
    await this.recordCreditTaken(
      dinesh,
      dineshSale,
      dineshSale.dueAmount,
      dineshSale.dueAmount,
      25,
    );
    await this.dataSource.getRepository(User).update(dinesh.id, {
      currentBalance: dineshSale.dueAmount,
      creditLimit: null,
    });

    // Real repayment through the service: ~45% of the balance settles
    // the 95-day bill in full and part of the 50-day one (FIFO), posts
    // the CRPAY ledger entry, and appends Credit_Paid to the statement —
    // while leaving the 31–60 and 0–30 ageing buckets populated.
    const payment = round2(Math.min(running * 0.45, 10000));
    await this.receivables.receivePayment(
      ayesha.id,
      {
        amount: payment,
        method: 'Cash',
        branchId: ctx.mainBranch.id,
        notes: 'Demo counter repayment',
      },
      { id: ctx.admin.id, role: UserRole.ADMIN, branchId: null },
    );

    this.logger.log(
      `Receivables seeded — 4 credit sales, 1 repayment of ${payment}.`,
    );
  }

  /**
   * Insert one backdated, partially/fully unpaid credit sale (skipped if a
   * prior run already created it). Returns the credit (balance-due) amount
   * plus identifiers for the matching `Credit_Taken` statement row.
   */
  private async createCreditSale(
    ctx: PosAccountingSeedContext,
    spec: {
      customer: User;
      index: number;
      daysAgo: number;
      productIndex: number;
      quantity: number;
      /** Fraction of the bill left unpaid (1 = fully on credit). */
      creditPortion: number;
    },
  ): Promise<{ saleId: string; saleNo: string; dueAmount: number }> {
    const saleRepo = this.dataSource.getRepository(Sale);
    const product = ctx.products[spec.productIndex % ctx.products.length];
    const unitPrice = Number(product.sellingPrice);
    const lineTotal = round2(spec.quantity * unitPrice);
    const total = lineTotal;
    const balanceDue = round2(total * spec.creditPortion);
    const paidAmount = round2(total - balanceDue);
    const saleNo = `CRD-DEMO-${String(spec.index).padStart(3, '0')}`;
    const createdAt = new Date(Date.now() - spec.daysAgo * DAY_MS);

    const existing = await saleRepo.findOne({
      where: { transactionNumber: saleNo },
    });
    if (existing) {
      return {
        saleId: existing.id,
        saleNo,
        dueAmount: round2(Number(existing.balanceDue)),
      };
    }

    const item: Partial<SaleItem> = {
      productId: product.id,
      quantity: spec.quantity,
      baseUnitQty: spec.quantity,
      unitId: null,
      unitPrice,
      discountAmount: 0,
      discountType: DiscountType.NONE,
      lineSubtotal: lineTotal,
      lineDiscountPercentage: 0,
      lineTaxRate: 0,
      lineTaxAmount: 0,
      lineTotal,
      priceLevelUsed: 'Retail',
      free: 0,
      status: 'Active',
    };

    const sale = await saleRepo.save(
      saleRepo.create({
        transactionNumber: saleNo,
        invoiceNumber: saleNo,
        branchId: ctx.mainBranch.id,
        cashierId: ctx.cashier1.id,
        customerUserId: spec.customer.id,
        type: TransactionType.SALE,
        subtotal: total,
        discountAmount: 0,
        discountType: DiscountType.NONE,
        taxAmount: 0,
        total,
        paymentMethod: PaymentMethod.CASH, // legacy column; tender lives on payments
        paidAmount,
        balanceDue,
        paymentStatus: balanceDue >= total ? 'Unpaid' : 'Partially_Paid',
        status: 'Active',
        location: 'Shop',
        items: [item] as SaleItem[],
      }),
    );
    await saleRepo
      .createQueryBuilder()
      .update(Sale)
      .set({ createdAt })
      .where('id = :id', { id: sale.id })
      .execute();
    return { saleId: sale.id, saleNo, dueAmount: balanceDue };
  }

  private async recordCreditTaken(
    customer: User,
    sale: { saleId: string; saleNo: string },
    amount: number,
    runningBalance: number,
    daysAgo: number,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(CreditTransaction);
    const saved = await repo.save(
      repo.create({
        userId: customer.id,
        saleId: sale.saleId,
        transactionType: 'Credit_Taken',
        amount,
        runningBalance,
        referenceNo: sale.saleNo,
        notes: 'Demo credit sale at the till',
      }),
    );
    await repo
      .createQueryBuilder()
      .update(CreditTransaction)
      .set({ createdAt: new Date(Date.now() - daysAgo * DAY_MS) })
      .where('id = :id', { id: saved.id })
      .execute();
  }

  // ── Journal vouchers ───────────────────────────────────

  private async seedJournalVouchers(
    ctx: PosAccountingSeedContext,
  ): Promise<void> {
    if ((await this.dataSource.getRepository(JournalVoucher).count()) > 0) {
      return;
    }
    const cashId = await this.accounts.idByCode(ACCOUNT_CODES.CASH);
    const equityId = await this.accounts.idByCode(ACCOUNT_CODES.OWNERS_EQUITY);
    const bankId = await this.accounts.idByCode(ACCOUNT_CODES.BANK);
    const opexId = await this.accounts.idByCode(
      ACCOUNT_CODES.OPERATING_EXPENSES,
    );
    if (!cashId || !equityId || !bankId || !opexId) {
      this.logger.warn('Journal seed skipped — chart accounts missing.');
      return;
    }

    const actor = {
      id: ctx.admin.id,
      role: UserRole.ADMIN,
      branchId: null,
    };
    const monthStart = new Date();
    monthStart.setDate(1);

    await this.journals.create(
      {
        branchId: ctx.mainBranch.id,
        entryDate: toIsoDate(monthStart),
        memo: 'Owner capital injection — month opening float',
        lines: [
          {
            accountId: cashId,
            entryType: LedgerEntryType.DEBIT,
            amount: 250000,
            description: 'Cash introduced by owner',
          },
          {
            accountId: equityId,
            entryType: LedgerEntryType.CREDIT,
            amount: 250000,
            description: 'Owner equity',
          },
        ],
      },
      actor,
    );
    await this.journals.create(
      {
        branchId: ctx.mainBranch.id,
        entryDate: toIsoDate(new Date(Date.now() - 3 * DAY_MS)),
        memo: 'Utilities for the month paid from bank',
        lines: [
          {
            accountId: opexId,
            entryType: LedgerEntryType.DEBIT,
            amount: 18500,
            description: 'Electricity + water',
          },
          {
            accountId: bankId,
            entryType: LedgerEntryType.CREDIT,
            amount: 18500,
            description: 'Bank transfer',
          },
        ],
      },
      actor,
    );
    this.logger.log('Journal vouchers seeded (capital injection, utilities).');
  }

  // ── Fiscal period lock ─────────────────────────────────

  /**
   * Lock the month five months back — far behind every backdated seed
   * posting (the oldest is ~95 days), so it demos the Periods grid
   * without ever rejecting another seed's ledger write.
   */
  private async seedPeriodLock(ctx: PosAccountingSeedContext): Promise<void> {
    const now = new Date();
    const target = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    );
    try {
      await this.fiscalPeriods.lock(
        target.getUTCFullYear(),
        target.getUTCMonth() + 1,
        ctx.admin.id,
      );
      this.logger.log(
        `Fiscal period ${target.getUTCFullYear()}-${target.getUTCMonth() + 1} locked.`,
      );
    } catch (err) {
      if (err instanceof ConflictException) return; // already locked
      throw err;
    }
  }
}
