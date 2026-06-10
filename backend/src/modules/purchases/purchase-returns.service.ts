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
import { PurchaseReturn } from '@/modules/purchases/entities/purchase-return.entity';
import { PurchaseReturnsRepository } from '@/modules/purchases/purchase-returns.repository';
import { GrnsRepository } from '@/modules/purchases/grns.repository';
import { SupplierPaymentsRepository } from '@/modules/purchases/supplier-payments.repository';
import { PurchaseDocNumberService } from '@/modules/purchases/purchase-doc-number.service';
import { CreatePurchaseReturnDto } from '@/modules/purchases/dto/create-purchase-return.dto';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';
import type { GrnPaymentStatus } from '@/modules/purchases/types/grn-payment-status.type';

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Debit notes (purchase returns). Against the originating GRN only —
 * unit costs snapshot the GRN line, quantities are capped at what was
 * received minus what was already returned, and the bill's outstanding
 * shrinks by the return total (modelled as paid-amount progress, capped
 * at the remaining balance so a settled bill can't go negative).
 * Stock leaves under the same lock discipline as the receive path.
 */
@Injectable()
export class PurchaseReturnsService {
  constructor(
    private readonly returns: PurchaseReturnsRepository,
    private readonly grns: GrnsRepository,
    private readonly payments: SupplierPaymentsRepository,
    private readonly docNumbers: PurchaseDocNumberService,
    private readonly accounting: AccountingRepository,
    private readonly dataSource: DataSource,
  ) {}

  async listForGrn(
    grnId: string,
    actor: PurchasesActor,
  ): Promise<PurchaseReturn[]> {
    const grn = await this.grns.findById(grnId);
    if (!grn) throw new NotFoundException('GRN not found');
    if (actor.role !== UserRole.ADMIN && grn.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot access purchase documents outside your branch',
      );
    }
    return this.returns.listForGrn(grnId);
  }

  async create(
    dto: CreatePurchaseReturnDto,
    actor: PurchasesActor,
  ): Promise<PurchaseReturn> {
    const grn = await this.grns.findById(dto.grnId);
    if (!grn) throw new NotFoundException('GRN not found');
    if (actor.role !== UserRole.ADMIN && grn.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot raise a debit note outside your branch',
      );
    }
    if (grn.status !== 'Received') {
      throw new ConflictException(
        `Cannot return against a GRN in status ${grn.status}`,
      );
    }

    // Cap each product at received-minus-already-returned.
    const grnQtyByProduct = new Map<string, { qty: number; cost: number }>();
    for (const item of grn.items) {
      const existing = grnQtyByProduct.get(item.productId);
      grnQtyByProduct.set(item.productId, {
        qty: (existing?.qty ?? 0) + Number(item.quantity),
        cost: Number(item.unitCost),
      });
    }
    const alreadyReturned = await this.returns.sumReturnedByProduct(grn.id);

    const lines = dto.items.map((it) => {
      const onGrn = grnQtyByProduct.get(it.productId);
      if (!onGrn) {
        throw new BadRequestException(
          `Product ${it.productId} is not on ${grn.grnNumber}`,
        );
      }
      const returnable = onGrn.qty - (alreadyReturned.get(it.productId) ?? 0);
      if (it.quantity > returnable) {
        throw new ConflictException(
          `Return quantity (${it.quantity}) exceeds the returnable remainder (${returnable}) on ${grn.grnNumber}`,
        );
      }
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitCost: onGrn.cost,
        lineTotal: round2(it.quantity * onGrn.cost),
      };
    });
    const total = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

    const billRemaining = round2(
      Number(grn.grandTotal) - Number(grn.paidAmount),
    );
    if (total > billRemaining) {
      throw new ConflictException(
        `Return total (${total}) exceeds the unpaid remainder (${billRemaining}) on ${grn.grnNumber} — settle the difference with the supplier directly`,
      );
    }

    const returnId = await this.dataSource.transaction(async (manager) => {
      const returnNumber = await this.docNumbers.next(
        'PRET',
        new Date().getFullYear(),
        manager,
      );

      const ret = await this.returns.insertReturn(manager, {
        returnNumber,
        grnId: grn.id,
        supplierId: grn.supplierId,
        branchId: grn.branchId,
        total,
        reason: dto.reason,
        createdByUserId: actor.id,
      });

      for (const line of lines) {
        await this.returns.insertReturnItem(manager, {
          purchaseReturnId: ret.id,
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          lineTotal: line.lineTotal,
        });

        const inv = await this.grns.lockInventoryRow(
          manager,
          line.productId,
          grn.branchId,
        );
        const onHand = Number(inv.quantity);
        if (onHand < line.quantity) {
          throw new ConflictException(
            `Cannot return ${line.quantity} of a product with only ${onHand} on hand`,
          );
        }
        const newQty = round3(onHand - line.quantity);
        await this.grns.setInventoryQuantity(manager, inv.id, newQty);
        await this.grns.insertMovement(manager, {
          productId: line.productId,
          branchId: grn.branchId,
          movementType: 'Return',
          qtyIn: 0,
          qtyOut: line.quantity,
          balanceAfter: newQty,
          refType: 'PurchaseReturn',
          refId: ret.id,
          notes: `Debit note ${returnNumber} against ${grn.grnNumber}`,
          createdByUserId: actor.id,
        });
      }

      // Bill adjustment: outstanding shrinks by the debit-note total.
      const lockedGrn = await this.payments.lockGrn(manager, grn.id);
      if (!lockedGrn) throw new NotFoundException('GRN vanished mid-return');
      const newPaid = round2(Number(lockedGrn.paidAmount) + total);
      const status: GrnPaymentStatus =
        newPaid >= Number(lockedGrn.grandTotal) ? 'Paid' : 'Partially_Paid';
      await this.payments.updateGrnPayment(manager, grn.id, newPaid, status);

      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId: grn.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: total,
        description: `Debit note ${returnNumber} — ${grn.supplier?.name ?? 'supplier'} (${dto.reason})`,
        referenceNumber: returnNumber,
        accountCode: ACCOUNT_CODES.INVENTORY,
      });

      return ret.id;
    });

    const saved = await this.returns.findById(returnId);
    if (!saved) throw new NotFoundException('Return vanished after save');
    return saved;
  }
}
