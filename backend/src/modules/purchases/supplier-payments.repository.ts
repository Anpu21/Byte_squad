import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { SupplierPayment } from '@/modules/purchases/entities/supplier-payment.entity';
import { SupplierPaymentAllocation } from '@/modules/purchases/entities/supplier-payment-allocation.entity';
import { Grn } from '@/modules/purchases/entities/grn.entity';

export interface ListSupplierPaymentsOptions {
  supplierId?: string;
  branchId?: string;
  limit: number;
  offset: number;
}

export interface PagedSupplierPayments {
  rows: SupplierPayment[];
  total: number;
}

/**
 * Supplier-payment repository (Rules.md §7). Allocation writes ride the
 * caller's EntityManager so the payment, its slices, and the GRN
 * paid-amount updates commit atomically.
 */
@Injectable()
export class SupplierPaymentsRepository {
  private readonly payments: Repository<SupplierPayment>;

  constructor(private readonly dataSource: DataSource) {
    this.payments = dataSource.getRepository(SupplierPayment);
  }

  async findById(id: string): Promise<SupplierPayment | null> {
    return this.payments.findOne({
      where: { id },
      relations: ['supplier', 'branch', 'allocations', 'allocations.grn'],
    });
  }

  async list(
    opts: ListSupplierPaymentsOptions,
  ): Promise<PagedSupplierPayments> {
    const qb = this.payments
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .leftJoinAndSelect('p.branch', 'branch')
      .leftJoinAndSelect('p.allocations', 'allocations');
    if (opts.supplierId) {
      qb.andWhere('p.supplier_id = :supplierId', {
        supplierId: opts.supplierId,
      });
    }
    if (opts.branchId) {
      qb.andWhere('p.branch_id = :branchId', { branchId: opts.branchId });
    }
    const [rows, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }

  /** Already-settled portion of the supplier's opening balance. */
  async sumOpeningAllocations(
    supplierId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(SupplierPaymentAllocation)
      : this.dataSource.getRepository(SupplierPaymentAllocation);
    const raw = await repo
      .createQueryBuilder('a')
      .innerJoin('a.payment', 'p')
      .select('COALESCE(SUM(a.amount), 0)', 'total')
      .where('p.supplier_id = :supplierId', { supplierId })
      .andWhere('a.grn_id IS NULL')
      .getRawOne<{ total: string }>();
    return Number(raw?.total ?? 0);
  }

  async insertPayment(
    manager: EntityManager,
    partial: DeepPartial<SupplierPayment>,
  ): Promise<SupplierPayment> {
    const repo = manager.getRepository(SupplierPayment);
    return repo.save(repo.create(partial));
  }

  async insertAllocation(
    manager: EntityManager,
    partial: DeepPartial<SupplierPaymentAllocation>,
  ): Promise<SupplierPaymentAllocation> {
    const repo = manager.getRepository(SupplierPaymentAllocation);
    return repo.save(repo.create(partial));
  }

  /** Lock a bill row so concurrent payments serialize on it. */
  async lockGrn(manager: EntityManager, grnId: string): Promise<Grn | null> {
    return manager
      .getRepository(Grn)
      .createQueryBuilder('g')
      .setLock('pessimistic_write')
      .where('g.id = :grnId', { grnId })
      .getOne();
  }

  async updateGrnPayment(
    manager: EntityManager,
    grnId: string,
    paidAmount: number,
    paymentStatus: Grn['paymentStatus'],
  ): Promise<void> {
    await manager
      .getRepository(Grn)
      .update(grnId, { paidAmount, paymentStatus });
  }
}
