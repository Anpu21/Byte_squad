import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { SupplierPayment } from '@/modules/purchases/entities/supplier-payment.entity';
import { SupplierPaymentsRepository } from '@/modules/purchases/supplier-payments.repository';
import { PurchaseDocNumberService } from '@/modules/purchases/purchase-doc-number.service';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { CreateSupplierPaymentDto } from '@/modules/purchases/dto/create-supplier-payment.dto';
import { ListSupplierPaymentsQueryDto } from '@/modules/purchases/dto/list-supplier-payments-query.dto';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';
import type { GrnPaymentStatus } from '@/modules/purchases/types/grn-payment-status.type';

export interface SupplierPaymentsListResponse {
  rows: SupplierPayment[];
  total: number;
  limit: number;
  offset: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Supplier payment voucher with BUSY-style bill-by-bill adjustment: every
 * payment is fully allocated against specific GRN bills (or the supplier's
 * opening balance), advancing each bill's `paidAmount`/`paymentStatus`
 * under a row lock.
 *
 * No ledger entry is posted here on purpose: the flat single-column ledger
 * already carries the purchase DEBIT from the GRN — re-posting the
 * settlement would double-count the outflow. Phase 3's double-entry split
 * (AP vs Bank) is where settlements become ledger-visible.
 */
@Injectable()
export class SupplierPaymentsService {
  constructor(
    private readonly payments: SupplierPaymentsRepository,
    private readonly suppliers: SuppliersRepository,
    private readonly docNumbers: PurchaseDocNumberService,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    query: ListSupplierPaymentsQueryDto,
    actor: PurchasesActor,
  ): Promise<SupplierPaymentsListResponse> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const branchId =
      actor.role === UserRole.ADMIN
        ? query.branchId
        : (actor.branchId ?? undefined);
    const { rows, total } = await this.payments.list({
      supplierId: query.supplierId,
      branchId,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  async create(
    dto: CreateSupplierPaymentDto,
    actor: PurchasesActor,
  ): Promise<SupplierPayment> {
    const branchId = this.resolveBranch(dto.branchId, actor);

    const supplier = await this.suppliers.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found');

    const amount = round2(dto.amount);
    const allocationSum = round2(
      dto.allocations.reduce((sum, a) => sum + a.amount, 0),
    );
    if (allocationSum !== amount) {
      throw new BadRequestException(
        `Allocations (${allocationSum}) must sum exactly to the payment amount (${amount})`,
      );
    }
    const grnIds = dto.allocations
      .map((a) => a.grnId)
      .filter((id): id is string => !!id);
    if (new Set(grnIds).size !== grnIds.length) {
      throw new BadRequestException(
        'Each bill may appear only once per payment',
      );
    }

    const paymentId = await this.dataSource.transaction(async (manager) => {
      const paidAt = dto.paidAt ?? toIsoDate(new Date());
      const paymentNumber = await this.docNumbers.next(
        'SPAY',
        new Date(paidAt).getFullYear(),
        manager,
      );

      const payment = await this.payments.insertPayment(manager, {
        paymentNumber,
        supplierId: supplier.id,
        branchId,
        method: dto.method,
        amount,
        paidAt,
        notes: dto.notes ?? null,
        createdByUserId: actor.id,
      });

      for (const allocation of dto.allocations) {
        const slice = round2(allocation.amount);

        if (!allocation.grnId) {
          // Opening-balance slice — capped at what is still unsettled.
          const alreadySettled = await this.payments.sumOpeningAllocations(
            supplier.id,
            manager,
          );
          const remaining = round2(
            Number(supplier.openingBalance) - alreadySettled,
          );
          if (slice > remaining) {
            throw new ConflictException(
              `Opening-balance allocation (${slice}) exceeds the unsettled opening balance (${remaining})`,
            );
          }
        } else {
          const grn = await this.payments.lockGrn(manager, allocation.grnId);
          if (!grn) {
            throw new NotFoundException(`Bill ${allocation.grnId} not found`);
          }
          if (grn.supplierId !== supplier.id) {
            throw new BadRequestException(
              `Bill ${grn.grnNumber} belongs to a different supplier`,
            );
          }
          if (grn.status !== 'Received') {
            throw new ConflictException(
              `Bill ${grn.grnNumber} is ${grn.status} and cannot be paid`,
            );
          }
          const remaining = round2(
            Number(grn.grandTotal) - Number(grn.paidAmount),
          );
          if (slice > remaining) {
            throw new ConflictException(
              `Allocation (${slice}) exceeds the remaining balance (${remaining}) on ${grn.grnNumber}`,
            );
          }
          const newPaid = round2(Number(grn.paidAmount) + slice);
          const status: GrnPaymentStatus =
            newPaid >= Number(grn.grandTotal) ? 'Paid' : 'Partially_Paid';
          await this.payments.updateGrnPayment(
            manager,
            grn.id,
            newPaid,
            status,
          );
        }

        await this.payments.insertAllocation(manager, {
          paymentId: payment.id,
          grnId: allocation.grnId ?? null,
          amount: slice,
        });
      }

      return payment.id;
    });

    const saved = await this.payments.findById(paymentId);
    if (!saved) throw new NotFoundException('Payment vanished after save');
    return saved;
  }

  private resolveBranch(
    requested: string | undefined,
    actor: PurchasesActor,
  ): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException(
          'branchId is required when recording payments as an admin',
        );
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot record payments for another branch');
    }
    return actor.branchId;
  }
}
