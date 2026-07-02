import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { User } from '@users/entities/user.entity';
import { SuppliersService } from '@/modules/suppliers/suppliers.service';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { GrnsService } from '@/modules/purchases/grns.service';
import { PurchaseOrdersService } from '@/modules/purchases/purchase-orders.service';
import { SupplierPaymentsService } from '@/modules/purchases/supplier-payments.service';
import { PurchaseReturnsService } from '@/modules/purchases/purchase-returns.service';
import { Grn } from '@/modules/purchases/entities/grn.entity';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';
import type { SupplierPaymentMethod } from '@/modules/purchases/types/supplier-payment-method.type';

export interface PurchasesSeedContext {
  admin: User;
  mainBranch: Branch;
  downtownBranch: Branch;
  suburbanBranch: Branch;
  products: Product[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);
const round2 = (n: number): number => Math.round(n * 100) / 100;

interface GrnSpec {
  supplierId: string;
  branchId: string;
  /** Backdates `grnDate` so the ageing buckets fill out. */
  daysAgo: number;
  invoiceNo: string;
  products: Product[];
  withBatch?: boolean;
  /** Set when this receipt converts an open PO (PO → Received). */
  purchaseOrderId?: string;
  discount?: number;
}

/**
 * Demo purchases seed — a six-supplier directory and a spread of receipts,
 * orders, payments and debit notes across all three branches, dated back
 * over the last four months so every list filter, status pill, payables
 * ageing bucket and supplier-statement row has data on first login.
 *
 * Covers, by design:
 *  - branches: GRNs/POs/payments on Main, Downtown and Suburban;
 *  - GRN payment status: Unpaid, Partially_Paid, Paid;
 *  - GRN status: Received and one Voided (full stock + ledger reversal);
 *  - PO lifecycle: Draft, Sent, Cancelled, and Received (via conversion);
 *  - payment methods: Bank and Cash, plus opening-balance settlements
 *    (one pure, one mixed bill+opening slice).
 *
 * Everything goes through the real services, so stock, weighted-average
 * cost, batches, movements, ledger postings and doc-counters all land
 * exactly as production would.
 *
 * Idempotent: short-circuits when any supplier already exists. To pick up
 * an enriched seed on an already-seeded database, reset the DB first.
 */
@Injectable()
export class PurchasesSeedService {
  private readonly logger = new Logger(PurchasesSeedService.name);

  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly grnsService: GrnsService,
    private readonly ordersService: PurchaseOrdersService,
    private readonly paymentsService: SupplierPaymentsService,
    private readonly returnsService: PurchaseReturnsService,
  ) {}

  async seed(ctx: PurchasesSeedContext): Promise<void> {
    const { total } = await this.suppliersRepository.list({
      limit: 1,
      offset: 0,
    });
    if (total > 0) {
      this.logger.log('Purchases seed skipped — suppliers already exist.');
      return;
    }

    const active = ctx.products.filter((p) => p.isActive);
    if (active.length < 4) {
      this.logger.warn('Purchases seed skipped — not enough seeded products.');
      return;
    }
    /** Cyclic product picker so each receipt lists a distinct spread. */
    const pick = (offset: number, count: number): Product[] =>
      Array.from(
        { length: count },
        (_, i) => active[(offset + i) % active.length],
      );

    const actor: PurchasesActor = {
      id: ctx.admin.id,
      role: UserRole.ADMIN,
      branchId: null,
    };
    const supplierActor = { id: ctx.admin.id };
    const branch = {
      main: ctx.mainBranch.id,
      downtown: ctx.downtownBranch.id,
      suburban: ctx.suburbanBranch.id,
    };

    // ── Supplier directory (six, varied terms; two carry opening balances) ──
    const dairy = await this.suppliersService.create(
      {
        name: 'Lanka Dairies (Pvt) Ltd',
        contactName: 'Ruwan Perera',
        phone: '0112345678',
        email: 'orders@lankadairies.lk',
        creditTermDays: 30,
        openingBalance: 25000,
        notes: 'Chilled goods — deliveries Mon/Thu.',
      },
      supplierActor,
    );
    const produce = await this.suppliersService.create(
      {
        name: 'Ceylon Fresh Produce',
        contactName: 'Nadeesha Silva',
        phone: '0779876543',
        creditTermDays: 14,
      },
      supplierActor,
    );
    const spice = await this.suppliersService.create(
      {
        name: 'Kandy Spice Traders',
        contactName: 'Bandara Kumara',
        phone: '0812233445',
        email: 'sales@kandyspice.lk',
        creditTermDays: 45,
        openingBalance: 12000,
        notes: 'Bulk spices & dry rubs.',
      },
      supplierActor,
    );
    const beverage = await this.suppliersService.create(
      {
        name: 'Colombo Beverage Distributors',
        contactName: 'Imran Faleel',
        phone: '0114567890',
        email: 'orders@colombobev.lk',
        creditTermDays: 30,
      },
      supplierActor,
    );
    const bakery = await this.suppliersService.create(
      {
        name: 'Sunrise Bakery Supplies',
        contactName: 'Dilani Fernando',
        phone: '0718889990',
        creditTermDays: 7,
        notes: 'Flour, yeast & packaging — short terms.',
      },
      supplierActor,
    );
    const homecare = await this.suppliersService.create(
      {
        name: 'Island Home & Personal Care',
        contactName: 'Kasun Jayasinghe',
        phone: '0773344556',
        email: 'b2b@islandhpc.lk',
        creditTermDays: 60,
      },
      supplierActor,
    );

    // ── Goods receipts (twelve, across branches and backdated for ageing) ──
    const gAgedDairy = await this.makeGrn(actor, {
      supplierId: dairy.id,
      branchId: branch.main,
      daysAgo: 120,
      invoiceNo: 'LD-88401',
      products: pick(0, 3),
      withBatch: true,
    }); // ~90 days overdue → 90+ ageing bucket, left Unpaid
    const gPartDairy = await this.makeGrn(actor, {
      supplierId: dairy.id,
      branchId: branch.main,
      daysAgo: 75,
      invoiceNo: 'LD-88455',
      products: pick(3, 2),
    });
    const gPaidSpice = await this.makeGrn(actor, {
      supplierId: spice.id,
      branchId: branch.main,
      daysAgo: 45,
      invoiceNo: 'KS-1207',
      products: pick(5, 3),
      discount: 50,
    });
    const gCurBev = await this.makeGrn(actor, {
      supplierId: beverage.id,
      branchId: branch.downtown,
      daysAgo: 20,
      invoiceNo: 'CBD-3310',
      products: pick(8, 3),
    });
    const gPaidBakery = await this.makeGrn(actor, {
      supplierId: bakery.id,
      branchId: branch.downtown,
      daysAgo: 10,
      invoiceNo: 'SB-771',
      products: pick(11, 2),
    });
    const gFreshProduce = await this.makeGrn(actor, {
      supplierId: produce.id,
      branchId: branch.suburban,
      daysAgo: 5,
      invoiceNo: 'CFP-2291',
      products: pick(13, 3),
      withBatch: true,
    });
    const gPartHome = await this.makeGrn(actor, {
      supplierId: homecare.id,
      branchId: branch.main,
      daysAgo: 35,
      invoiceNo: 'IHP-540',
      products: pick(16, 2),
    });
    const gDtDairy = await this.makeGrn(actor, {
      supplierId: dairy.id,
      branchId: branch.downtown,
      daysAgo: 60,
      invoiceNo: 'LD-88460',
      products: pick(18, 2),
    }); // Unpaid, ~30 days overdue
    const gSubSpice = await this.makeGrn(actor, {
      supplierId: spice.id,
      branchId: branch.suburban,
      daysAgo: 90,
      invoiceNo: 'KS-1188',
      products: pick(20, 3),
    });
    const gVoidBev = await this.makeGrn(actor, {
      supplierId: beverage.id,
      branchId: branch.main,
      daysAgo: 15,
      invoiceNo: 'CBD-3318',
      products: pick(23, 2),
    });
    const gSubBakery = await this.makeGrn(actor, {
      supplierId: bakery.id,
      branchId: branch.suburban,
      daysAgo: 2,
      invoiceNo: 'SB-789',
      products: pick(25, 2),
      withBatch: true,
    }); // Unpaid, fresh

    // ── Purchase orders: Draft, Sent, Cancelled, and one Received via GRN ──
    await this.ordersService.create(
      {
        supplierId: spice.id,
        branchId: branch.main,
        expectedDate: toIsoDate(new Date(Date.now() + 7 * DAY_MS)),
        notes: 'Monthly spice top-up (draft)',
        items: this.orderItems(pick(5, 2)),
      },
      actor,
    ); // left Draft

    const poSent = await this.ordersService.create(
      {
        supplierId: homecare.id,
        branchId: branch.downtown,
        expectedDate: toIsoDate(new Date(Date.now() + 5 * DAY_MS)),
        notes: 'Cleaning & paper supplies',
        items: this.orderItems(pick(16, 2)),
      },
      actor,
    );
    await this.ordersService.send(poSent.id, actor); // → Sent

    const poCancel = await this.ordersService.create(
      {
        supplierId: produce.id,
        branchId: branch.suburban,
        expectedDate: toIsoDate(new Date(Date.now() + 4 * DAY_MS)),
        notes: 'Cancelled — supplier out of stock',
        items: this.orderItems(pick(13, 2)),
      },
      actor,
    );
    await this.ordersService.cancel(poCancel.id, actor); // → Cancelled

    const poRecv = await this.ordersService.create(
      {
        supplierId: produce.id,
        branchId: branch.downtown,
        expectedDate: toIsoDate(new Date(Date.now() + 2 * DAY_MS)),
        notes: 'Confirmed order — receiving on arrival',
        items: this.orderItems(pick(27, 2)),
      },
      actor,
    );
    await this.ordersService.send(poRecv.id, actor);
    const gPoRecv = await this.grnsService.create(
      {
        supplierId: produce.id,
        branchId: branch.downtown,
        purchaseOrderId: poRecv.id, // flips the PO to Received
        supplierInvoiceNo: 'CFP-2300',
        items: this.grnItems(pick(27, 2), false),
      },
      actor,
    );

    // ── Settlements: Card/Cash, full/partial, plus opening-balance slices ──
    await this.payGrn(actor, gPartDairy, {
      method: 'Card',
      fraction: 0.5,
      openingSlice: 3000, // mixed bill + opening-balance payment
    });
    await this.payGrn(actor, gPaidSpice, { method: 'Card', fraction: 1 }); // → Paid
    await this.payGrn(actor, gPaidBakery, { method: 'Cash', fraction: 1 }); // → Paid
    await this.payGrn(actor, gPartHome, { method: 'Card', fraction: 0.4 });
    await this.payGrn(actor, gSubSpice, { method: 'Card', fraction: 0.5 });
    await this.paymentsService.create(
      {
        supplierId: spice.id,
        branchId: branch.main,
        method: 'Cash',
        amount: 4000,
        allocations: [{ amount: 4000 }], // pure opening-balance settlement
      },
      actor,
    );

    // ── Debit notes (returns) against two of the unpaid receipts ──
    await this.returnLine(actor, gFreshProduce, 'Damaged in transit', 2);
    await this.returnLine(
      actor,
      gCurBev,
      'Short-dated stock — returned to supplier',
      1,
    );

    // ── One full reversal: void a recent, unpaid receipt ──
    await this.grnsService.void(
      gVoidBev.id,
      { reason: 'Wrong items delivered — full reversal' },
      actor,
    );

    const received = [
      gAgedDairy,
      gPartDairy,
      gPaidSpice,
      gCurBev,
      gPaidBakery,
      gFreshProduce,
      gPartHome,
      gDtDairy,
      gSubSpice,
      gSubBakery,
      gPoRecv,
    ];
    this.logger.log(
      `Purchases seed completed — 6 suppliers, ${received.length + 1} GRNs ` +
        `(1 voided), 4 POs, 6 payments, 2 debit notes across 3 branches.`,
    );
  }

  /** Build + persist one GRN through the real receive path. */
  private async makeGrn(actor: PurchasesActor, spec: GrnSpec): Promise<Grn> {
    const grnDate = toIsoDate(new Date(Date.now() - spec.daysAgo * DAY_MS));
    return this.grnsService.create(
      {
        supplierId: spec.supplierId,
        branchId: spec.branchId,
        grnDate,
        supplierInvoiceNo: spec.invoiceNo,
        items: this.grnItems(
          spec.products,
          spec.withBatch ?? false,
          spec.invoiceNo,
        ),
        ...(spec.purchaseOrderId
          ? { purchaseOrderId: spec.purchaseOrderId }
          : {}),
        ...(spec.discount ? { discountAmount: spec.discount } : {}),
      },
      actor,
    );
  }

  /** GRN line items — staggered quantities, unit cost drifting around cost. */
  private grnItems(products: Product[], withBatch: boolean, invoiceNo = 'B') {
    const expiry = toIsoDate(new Date(Date.now() + 180 * DAY_MS));
    return products.map((p, i) => {
      const item = {
        productId: p.id,
        quantity: 12 + i * 6,
        unitCost: this.unitCost(p, i),
      };
      return withBatch
        ? { ...item, batchNo: `${invoiceNo}-B${i + 1}`, expiryDate: expiry }
        : item;
    });
  }

  /** PO line items — no batch/expiry; intent only. */
  private orderItems(products: Product[]) {
    return products.map((p, i) => ({
      productId: p.id,
      quantity: 18 + i * 4,
      unitCost: this.unitCost(p, i),
    }));
  }

  /** Cost drifts ±2% around the product's current cost so the weighted
   * average actually moves; floored so it is always a positive amount. */
  private unitCost(product: Product, i: number): number {
    const base = Math.max(Number(product.costPrice), 10);
    return round2(base * (1 + ((i % 5) - 2) * 0.01));
  }

  /** Pay a fraction of a GRN, optionally with an opening-balance slice. */
  private async payGrn(
    actor: PurchasesActor,
    grn: Grn,
    opts: {
      method: SupplierPaymentMethod;
      fraction: number;
      openingSlice?: number;
    },
  ): Promise<void> {
    const grnPart = round2(Number(grn.grandTotal) * opts.fraction);
    const opening = opts.openingSlice ?? 0;
    const allocations: Array<{ grnId?: string; amount: number }> = [
      { grnId: grn.id, amount: grnPart },
    ];
    if (opening > 0) allocations.push({ amount: opening });
    await this.paymentsService.create(
      {
        supplierId: grn.supplierId,
        branchId: grn.branchId,
        method: opts.method,
        amount: round2(grnPart + opening),
        allocations,
      },
      actor,
    );
  }

  /** Raise a debit note for `qty` of the GRN's first line. */
  private async returnLine(
    actor: PurchasesActor,
    grn: Grn,
    reason: string,
    qty: number,
  ): Promise<void> {
    const line = grn.items[0];
    if (!line) return;
    await this.returnsService.create(
      {
        grnId: grn.id,
        reason,
        items: [{ productId: line.productId, quantity: qty }],
      },
      actor,
    );
  }
}
