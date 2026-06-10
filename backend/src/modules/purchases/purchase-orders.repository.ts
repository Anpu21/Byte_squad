import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { PurchaseOrder } from '@/modules/purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '@/modules/purchases/entities/purchase-order-item.entity';
import type { PurchaseOrderStatus } from '@/modules/purchases/types/purchase-order-status.type';

export interface ListPurchaseOrdersOptions {
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
  limit: number;
  offset: number;
}

export interface PagedPurchaseOrders {
  rows: PurchaseOrder[];
  total: number;
}

/** Purchase-order repository (Rules.md §7) — intent documents only. */
@Injectable()
export class PurchaseOrdersRepository {
  private readonly orders: Repository<PurchaseOrder>;

  constructor(private readonly dataSource: DataSource) {
    this.orders = dataSource.getRepository(PurchaseOrder);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.orders.findOne({
      where: { id },
      relations: ['supplier', 'branch', 'items', 'items.product'],
    });
  }

  async list(opts: ListPurchaseOrdersOptions): Promise<PagedPurchaseOrders> {
    const qb = this.orders
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.branch', 'branch')
      .leftJoinAndSelect('po.items', 'items');
    if (opts.branchId) {
      qb.andWhere('po.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.supplierId) {
      qb.andWhere('po.supplier_id = :supplierId', {
        supplierId: opts.supplierId,
      });
    }
    if (opts.status) {
      qb.andWhere('po.status = :status', { status: opts.status });
    }
    const [rows, total] = await qb
      .orderBy('po.created_at', 'DESC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }

  async insertOrder(
    manager: EntityManager,
    partial: DeepPartial<PurchaseOrder>,
  ): Promise<PurchaseOrder> {
    const repo = manager.getRepository(PurchaseOrder);
    return repo.save(repo.create(partial));
  }

  async insertItem(
    manager: EntityManager,
    partial: DeepPartial<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem> {
    const repo = manager.getRepository(PurchaseOrderItem);
    return repo.save(repo.create(partial));
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(PurchaseOrder) : this.orders;
    await repo.update(id, { status });
  }
}
