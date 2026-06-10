import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { AccountingRepository } from '@accounting/accounting.repository';
import { ACCOUNT_CODES } from '@accounting/types/account-code.type';
import { Grn } from '@/modules/purchases/entities/grn.entity';
import { GrnsRepository } from '@/modules/purchases/grns.repository';
import { PurchaseDocNumberService } from '@/modules/purchases/purchase-doc-number.service';
import { PurchaseOrdersRepository } from '@/modules/purchases/purchase-orders.repository';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { CreateGrnDto } from '@/modules/purchases/dto/create-grn.dto';
import { ListGrnsQueryDto } from '@/modules/purchases/dto/list-grns-query.dto';
import { VoidGrnDto } from '@/modules/purchases/dto/void-grn.dto';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';

export interface GrnsListResponse {
  rows: Grn[];
  total: number;
  limit: number;
  offset: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Goods Received Note workflow — the BUSY "purchase voucher". One receive
 * transaction does it all atomically:
 *
 *   1. allocate `GRN-YYYY-NNNNNN` (counter under pessimistic lock),
 *   2. per line: lock branch inventory, stock IN, weighted-average the
 *      product's global `costPrice`, record a batch (if batch/expiry given)
 *      and a `Purchase` stock movement,
 *   3. post a DEBIT ledger entry for the grand total,
 *   4. persist the GRN header+items — which doubles as the supplier *bill*
 *      (`paidAmount`/`paymentStatus` advance as payments allocate to it).
 *
 * Managers are pinned to their own branch; admins must say which branch
 * received the goods.
 */
@Injectable()
export class GrnsService {
  constructor(
    private readonly grns: GrnsRepository,
    private readonly suppliers: SuppliersRepository,
    private readonly orders: PurchaseOrdersRepository,
    private readonly docNumbers: PurchaseDocNumberService,
    private readonly accounting: AccountingRepository,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    query: ListGrnsQueryDto,
    actor: PurchasesActor,
  ): Promise<GrnsListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const branchId = this.resolveBranchForRead(query.branchId, actor);
    const { rows, total } = await this.grns.list({
      branchId,
      supplierId: query.supplierId,
      status: query.status,
      paymentStatus: query.paymentStatus,
      startDate: query.startDate,
      endDate: query.endDate,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  async getById(id: string, actor: PurchasesActor): Promise<Grn> {
    const grn = await this.grns.findById(id);
    if (!grn) throw new NotFoundException('GRN not found');
    if (actor.role !== UserRole.ADMIN && grn.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot access purchase documents outside your branch',
      );
    }
    return grn;
  }

  async create(dto: CreateGrnDto, actor: PurchasesActor): Promise<Grn> {
    const branchId = this.resolveBranchForWrite(dto.branchId, actor);

    const supplier = await this.suppliers.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.status !== 'Active') {
      throw new ConflictException(
        `Supplier "${supplier.name}" is inactive — reactivate before receiving goods`,
      );
    }

    // Resolve + validate every product up-front (cheap, outside the txn).
    const productIds = [...new Set(dto.items.map((it) => it.productId))];
    const products = await this.grns.findProductsByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const it of dto.items) {
      const product = productById.get(it.productId);
      if (!product) {
        throw new NotFoundException(`Product ${it.productId} not found`);
      }
      if (!product.isActive) {
        throw new ConflictException(
          `Product "${product.name}" is inactive and cannot be received`,
        );
      }
    }

    // Money math: per-line totals → header totals → due date from terms.
    const lines = dto.items.map((it) => ({
      ...it,
      lineTotal: round2(it.quantity * it.unitCost),
    }));
    const subTotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
    const discountAmount = round2(dto.discountAmount ?? 0);
    if (discountAmount > subTotal) {
      throw new BadRequestException(
        'Discount cannot exceed the items subtotal',
      );
    }
    const grandTotal = round2(subTotal - discountAmount);

    // Converting a PO? It must match the supplier+branch and still be open.
    if (dto.purchaseOrderId) {
      const order = await this.orders.findById(dto.purchaseOrderId);
      if (!order) throw new NotFoundException('Purchase order not found');
      if (order.supplierId !== supplier.id) {
        throw new BadRequestException(
          `${order.poNumber} belongs to a different supplier`,
        );
      }
      if (order.branchId !== branchId) {
        throw new BadRequestException(
          `${order.poNumber} was raised for a different branch`,
        );
      }
      if (order.status !== 'Draft' && order.status !== 'Sent') {
        throw new ConflictException(
          `${order.poNumber} is ${order.status} and cannot be received`,
        );
      }
    }

    const grnDate = dto.grnDate ?? toIsoDate(new Date());
    const due = new Date(grnDate);
    due.setDate(due.getDate() + supplier.creditTermDays);
    const dueDate = toIsoDate(due);
    const year = new Date(grnDate).getFullYear();

    const grnId = await this.dataSource.transaction(async (manager) => {
      const grnNumber = await this.docNumbers.next('GRN', year, manager);

      const grn = await this.grns.insertGrn(manager, {
        grnNumber,
        supplierId: supplier.id,
        branchId,
        purchaseOrderId: dto.purchaseOrderId ?? null,
        supplierInvoiceNo: dto.supplierInvoiceNo ?? null,
        grnDate,
        dueDate,
        subTotal,
        discountAmount,
        grandTotal,
        paidAmount: 0,
        paymentStatus: 'Unpaid',
        status: 'Received',
        notes: dto.notes ?? null,
        createdByUserId: actor.id,
      });

      const receivedAt = new Date();
      for (const line of lines) {
        await this.grns.insertGrnItem(manager, {
          grnId: grn.id,
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          lineTotal: line.lineTotal,
          batchNo: line.batchNo ?? null,
          expiryDate: line.expiryDate ?? null,
        });

        // Weighted-average cost BEFORE this line lands: costPrice is a
        // global column, so the on-hand basis is the cross-branch sum.
        const product = await this.grns.lockProduct(manager, line.productId);
        if (!product) {
          throw new NotFoundException(`Product ${line.productId} not found`);
        }
        const onHandBefore = await this.grns.sumOnHandAllBranches(
          manager,
          line.productId,
        );
        const basis = Math.max(onHandBefore, 0);
        const newCost =
          basis + line.quantity > 0
            ? round2(
                (basis * Number(product.costPrice) +
                  line.quantity * line.unitCost) /
                  (basis + line.quantity),
              )
            : Number(product.costPrice);
        if (newCost !== Number(product.costPrice)) {
          await this.grns.updateProductCost(manager, line.productId, newCost);
        }

        // Stock IN on the receiving branch (row locked for the update).
        const inv = await this.grns.lockInventoryRow(
          manager,
          line.productId,
          branchId,
        );
        const newQty = round3(Number(inv.quantity) + line.quantity);
        await this.grns.setInventoryQuantity(
          manager,
          inv.id,
          newQty,
          receivedAt,
        );

        if (line.batchNo || line.expiryDate) {
          await this.grns.insertBatch(manager, {
            productId: line.productId,
            branchId,
            batchNo: line.batchNo ?? null,
            expiryDate: line.expiryDate ?? null,
            quantity: line.quantity,
            receivedAt,
            notes: grnNumber,
            createdByUserId: actor.id,
          });
        }

        await this.grns.insertMovement(manager, {
          productId: line.productId,
          branchId,
          movementType: 'Purchase',
          qtyIn: line.quantity,
          qtyOut: 0,
          balanceAfter: newQty,
          refType: 'GRN',
          refId: grn.id,
          notes: `Purchase ${grnNumber}`,
          createdByUserId: actor.id,
        });
      }

      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId,
        entryType: LedgerEntryType.DEBIT,
        amount: grandTotal,
        description: `Purchase ${grnNumber} — ${supplier.name}`,
        referenceNumber: grnNumber,
        accountCode: ACCOUNT_CODES.INVENTORY,
      });

      if (dto.purchaseOrderId) {
        await this.orders.updateStatus(
          dto.purchaseOrderId,
          'Received',
          manager,
        );
      }

      return grn.id;
    });

    const saved = await this.grns.findById(grnId);
    if (!saved) throw new NotFoundException('GRN vanished after receive');
    return saved;
  }

  /**
   * Void a received GRN (admin only): stock OUT per line (refused if the
   * goods were already sold), zero the GRN's batch rows, post the reversing
   * CREDIT ledger entry. Blocked once any payment is allocated.
   */
  async void(id: string, dto: VoidGrnDto, actor: PurchasesActor): Promise<Grn> {
    const grn = await this.getById(id, actor);
    if (grn.status !== 'Received') {
      throw new ConflictException(`Cannot void a GRN in status ${grn.status}`);
    }
    if (Number(grn.paidAmount) > 0) {
      throw new ConflictException(
        'Cannot void a GRN that already has payments allocated',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of grn.items) {
        const inv = await this.grns.lockInventoryRow(
          manager,
          item.productId,
          grn.branchId,
        );
        const qty = Number(item.quantity);
        const onHand = Number(inv.quantity);
        if (onHand < qty) {
          throw new ConflictException(
            `Cannot void ${grn.grnNumber}: received stock for "${item.product?.name ?? item.productId}" has already been consumed`,
          );
        }
        const newQty = round3(onHand - qty);
        await this.grns.setInventoryQuantity(manager, inv.id, newQty);
        await this.grns.insertMovement(manager, {
          productId: item.productId,
          branchId: grn.branchId,
          movementType: 'Adjustment',
          qtyIn: 0,
          qtyOut: qty,
          balanceAfter: newQty,
          refType: 'GRN_Void',
          refId: grn.id,
          notes: `Purchase ${grn.grnNumber} voided`,
          createdByUserId: actor.id,
        });
      }

      await this.grns.zeroBatchesByNote(manager, grn.grnNumber);

      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId: grn.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: Number(grn.grandTotal),
        description: `Purchase ${grn.grnNumber} voided — ${dto.reason}`,
        referenceNumber: grn.grnNumber,
        accountCode: ACCOUNT_CODES.INVENTORY,
      });

      await this.grns.updateGrn(manager, grn.id, {
        status: 'Voided',
        voidedAt: new Date(),
        voidedByUserId: actor.id,
        voidReason: dto.reason,
      });
    });

    const updated = await this.grns.findById(id);
    if (!updated) throw new NotFoundException('GRN vanished after void');
    return updated;
  }

  /** Managers read their branch only; admins may filter or span all. */
  private resolveBranchForRead(
    requested: string | undefined,
    actor: PurchasesActor,
  ): string | undefined {
    if (actor.role === UserRole.ADMIN) return requested;
    return actor.branchId ?? undefined;
  }

  /** Managers write to their branch; admins must name the receiving branch. */
  private resolveBranchForWrite(
    requested: string | undefined,
    actor: PurchasesActor,
  ): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException(
          'branchId is required when receiving goods as an admin',
        );
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot receive goods into another branch');
    }
    return actor.branchId;
  }
}
