import { Injectable } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import { Grn } from '@/modules/purchases/entities/grn.entity';
import { GrnItem } from '@/modules/purchases/entities/grn-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Product } from '@products/entities/product.entity';
import { ProductBatch } from '@inventory/entities/product-batch.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import type { GrnPaymentStatus } from '@/modules/purchases/types/grn-payment-status.type';
import type { GrnStatus } from '@/modules/purchases/types/grn-status.type';

export interface ListGrnsOptions {
  branchId?: string;
  supplierId?: string;
  status?: GrnStatus;
  paymentStatus?: GrnPaymentStatus;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

export interface PagedGrns {
  rows: Grn[];
  total: number;
}

/**
 * GRN repository (Rules.md §7). Read paths use the lazily-resolved
 * repositories; every write takes the caller's `EntityManager` so the whole
 * goods-receipt (header, lines, stock, batches, movements, ledger) commits or
 * rolls back as one transaction.
 */
@Injectable()
export class GrnsRepository {
  private readonly grns: Repository<Grn>;

  constructor(private readonly dataSource: DataSource) {
    this.grns = dataSource.getRepository(Grn);
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Grn | null> {
    return this.grns.findOne({
      where: { id },
      relations: ['supplier', 'branch', 'items', 'items.product'],
    });
  }

  async list(opts: ListGrnsOptions): Promise<PagedGrns> {
    const qb = this.grns
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.supplier', 'supplier')
      .leftJoinAndSelect('g.branch', 'branch');

    if (opts.branchId) {
      qb.andWhere('g.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.supplierId) {
      qb.andWhere('g.supplier_id = :supplierId', {
        supplierId: opts.supplierId,
      });
    }
    if (opts.status) {
      qb.andWhere('g.status = :status', { status: opts.status });
    }
    if (opts.paymentStatus) {
      qb.andWhere('g.payment_status = :paymentStatus', {
        paymentStatus: opts.paymentStatus,
      });
    }
    if (opts.startDate) {
      qb.andWhere('g.grn_date >= :startDate', { startDate: opts.startDate });
    }
    if (opts.endDate) {
      qb.andWhere('g.grn_date <= :endDate', { endDate: opts.endDate });
    }

    const [rows, total] = await qb
      .orderBy('g.created_at', 'DESC')
      .skip(opts.offset)
      .take(opts.limit)
      .getManyAndCount();
    return { rows, total };
  }

  async findProductsByIds(productIds: string[]): Promise<Product[]> {
    if (productIds.length === 0) return [];
    return this.dataSource
      .getRepository(Product)
      .find({ where: { id: In(productIds) } });
  }

  // ── Transactional writes (all take the surrounding EntityManager) ────────

  async insertGrn(
    manager: EntityManager,
    partial: DeepPartial<Grn>,
  ): Promise<Grn> {
    const repo = manager.getRepository(Grn);
    return repo.save(repo.create(partial));
  }

  async updateGrn(
    manager: EntityManager,
    id: string,
    partial: DeepPartial<Grn>,
  ): Promise<void> {
    await manager.getRepository(Grn).update(id, partial);
  }

  async insertGrnItem(
    manager: EntityManager,
    partial: DeepPartial<GrnItem>,
  ): Promise<GrnItem> {
    const repo = manager.getRepository(GrnItem);
    return repo.save(repo.create(partial));
  }

  /** Lock (or create-then-lock) the branch inventory row for a product. */
  async lockInventoryRow(
    manager: EntityManager,
    productId: string,
    branchId: string,
  ): Promise<Inventory> {
    const repo = manager.getRepository(Inventory);
    const locked = await repo
      .createQueryBuilder('inv')
      .setLock('pessimistic_write')
      .where('inv.product_id = :productId AND inv.branch_id = :branchId', {
        productId,
        branchId,
      })
      .getOne();
    if (locked) return locked;

    await repo.save(repo.create({ productId, branchId, quantity: 0 }));
    const created = await repo
      .createQueryBuilder('inv')
      .setLock('pessimistic_write')
      .where('inv.product_id = :productId AND inv.branch_id = :branchId', {
        productId,
        branchId,
      })
      .getOne();
    if (!created) {
      throw new Error(
        `Inventory row vanished for product ${productId} @ ${branchId}`,
      );
    }
    return created;
  }

  async setInventoryQuantity(
    manager: EntityManager,
    inventoryId: string,
    quantity: number,
    restockedAt?: Date,
  ): Promise<void> {
    await manager.getRepository(Inventory).update(inventoryId, {
      quantity,
      ...(restockedAt ? { lastRestockedAt: restockedAt } : {}),
    });
  }

  /** Cross-branch on-hand total for a product (weighted-average input). */
  async sumOnHandAllBranches(
    manager: EntityManager,
    productId: string,
  ): Promise<number> {
    const raw = await manager
      .getRepository(Inventory)
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.quantity), 0)', 'total')
      .where('inv.product_id = :productId', { productId })
      .getRawOne<{ total: string }>();
    return Number(raw?.total ?? 0);
  }

  /** Lock the product row so concurrent GRNs serialize cost updates. */
  async lockProduct(
    manager: EntityManager,
    productId: string,
  ): Promise<Product | null> {
    return manager
      .getRepository(Product)
      .createQueryBuilder('p')
      .setLock('pessimistic_write')
      .where('p.id = :productId', { productId })
      .getOne();
  }

  async updateProductCost(
    manager: EntityManager,
    productId: string,
    costPrice: number,
  ): Promise<void> {
    await manager.getRepository(Product).update(productId, { costPrice });
  }

  async insertBatch(
    manager: EntityManager,
    partial: DeepPartial<ProductBatch>,
  ): Promise<ProductBatch> {
    const repo = manager.getRepository(ProductBatch);
    return repo.save(repo.create(partial));
  }

  /** Void support: zero out the batch rows this GRN created (note-tagged). */
  async zeroBatchesByNote(manager: EntityManager, note: string): Promise<void> {
    await manager
      .getRepository(ProductBatch)
      .createQueryBuilder()
      .update(ProductBatch)
      .set({ quantity: 0 })
      .where('notes = :note', { note })
      .execute();
  }

  async insertMovement(
    manager: EntityManager,
    partial: DeepPartial<StockMovement>,
  ): Promise<StockMovement> {
    const repo = manager.getRepository(StockMovement);
    return repo.save(repo.create(partial));
  }

  async insertLedgerEntry(
    manager: EntityManager,
    partial: DeepPartial<LedgerEntry>,
  ): Promise<LedgerEntry> {
    const repo = manager.getRepository(LedgerEntry);
    return repo.save(repo.create(partial));
  }
}
