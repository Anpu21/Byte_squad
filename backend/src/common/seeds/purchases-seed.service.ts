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
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';

export interface PurchasesSeedContext {
  admin: User;
  mainBranch: Branch;
  products: Product[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Demo purchases seed — two suppliers, a sent PO, two GRNs (one backdated
 * past its terms so the ageing buckets light up, one fresh with
 * batch/expiry), a partial bill-by-bill payment, and a debit note. Drives
 * the real services so every side-effect (stock, weighted cost, batches,
 * movements, ledger, counters) lands exactly as production would.
 *
 * Idempotent: short-circuits when any supplier already exists.
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

    const picks = ctx.products.filter((p) => p.isActive).slice(0, 4);
    if (picks.length < 3) {
      this.logger.warn('Purchases seed skipped — not enough seeded products.');
      return;
    }

    const actor: PurchasesActor = {
      id: ctx.admin.id,
      role: UserRole.ADMIN,
      branchId: null,
    };

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
      { id: actor.id },
    );
    const produce = await this.suppliersService.create(
      {
        name: 'Ceylon Fresh Produce',
        contactName: 'Nadeesha Silva',
        phone: '0779876543',
        creditTermDays: 14,
      },
      { id: actor.id },
    );

    // Backdated GRN: 45 days old on 30-day terms → ~15 days overdue, so the
    // ageing report has a non-empty 1-30 bucket out of the box.
    const backdated = toIsoDate(new Date(Date.now() - 45 * DAY_MS));
    const expiry = toIsoDate(new Date(Date.now() + 90 * DAY_MS));
    const grn1 = await this.grnsService.create(
      {
        supplierId: dairy.id,
        branchId: ctx.mainBranch.id,
        grnDate: backdated,
        supplierInvoiceNo: 'LD-88412',
        items: picks.slice(0, 3).map((p, i) => ({
          productId: p.id,
          quantity: 24 + i * 12,
          unitCost: Math.max(Number(p.costPrice), 50),
          batchNo: `LD-${1000 + i}`,
          expiryDate: expiry,
        })),
      },
      actor,
    );

    const grn2 = await this.grnsService.create(
      {
        supplierId: produce.id,
        branchId: ctx.mainBranch.id,
        supplierInvoiceNo: 'CFP-2291',
        items: picks.slice(1, 4).map((p, i) => ({
          productId: p.id,
          quantity: 10 + i * 5,
          unitCost: Math.max(Number(p.costPrice), 40),
        })),
      },
      actor,
    );

    // Open PO from the produce supplier (pending-orders view).
    const po = await this.ordersService.create(
      {
        supplierId: produce.id,
        branchId: ctx.mainBranch.id,
        expectedDate: toIsoDate(new Date(Date.now() + 3 * DAY_MS)),
        notes: 'Weekly veg restock',
        items: picks.slice(0, 2).map((p) => ({
          productId: p.id,
          quantity: 20,
          unitCost: Math.max(Number(p.costPrice), 40),
        })),
      },
      actor,
    );
    await this.ordersService.send(po.id, actor);

    // Partial settlement: half of GRN 1 plus a slice of the opening balance.
    const half = Math.round((Number(grn1.grandTotal) / 2) * 100) / 100;
    await this.paymentsService.create(
      {
        supplierId: dairy.id,
        branchId: ctx.mainBranch.id,
        method: 'Bank',
        amount: Math.round((half + 5000) * 100) / 100,
        allocations: [{ grnId: grn1.id, amount: half }, { amount: 5000 }],
      },
      actor,
    );

    // One damaged unit back to the produce supplier (debit note).
    const firstLine = grn2.items[0];
    if (firstLine) {
      await this.returnsService.create(
        {
          grnId: grn2.id,
          reason: 'Damaged in transit',
          items: [{ productId: firstLine.productId, quantity: 1 }],
        },
        actor,
      );
    }

    this.logger.log(
      `Purchases seed completed — ${grn1.grnNumber}, ${grn2.grnNumber}, ${po.poNumber}.`,
    );
  }
}
