import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { PurchaseReturn } from '@/modules/purchases-returns/entities/purchase-return.entity';
import { PurchaseReturnItem } from '@/modules/purchases-returns/entities/purchase-return-item.entity';

/** Purchase-return repository (Rules.md §7) — debit-note documents. */
@Injectable()
export class PurchaseReturnsRepository {
  private readonly returns: Repository<PurchaseReturn>;

  constructor(private readonly dataSource: DataSource) {
    this.returns = dataSource.getRepository(PurchaseReturn);
  }

  async findById(id: string): Promise<PurchaseReturn | null> {
    return this.returns.findOne({
      where: { id },
      relations: ['supplier', 'branch', 'grn', 'items', 'items.product'],
    });
  }

  async listForGrn(grnId: string): Promise<PurchaseReturn[]> {
    return this.returns.find({
      where: { grnId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Already-returned base-unit qty per product on a GRN. */
  async sumReturnedByProduct(
    grnId: string,
    manager?: EntityManager,
  ): Promise<Map<string, number>> {
    const repo = manager
      ? manager.getRepository(PurchaseReturnItem)
      : this.dataSource.getRepository(PurchaseReturnItem);
    const raw = await repo
      .createQueryBuilder('item')
      .innerJoin('item.purchaseReturn', 'ret')
      .select('item.product_id', 'product_id')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'total')
      .where('ret.grn_id = :grnId', { grnId })
      .groupBy('item.product_id')
      .getRawMany<{ product_id: string; total: string }>();
    return new Map(raw.map((r) => [r.product_id, Number(r.total)]));
  }

  async insertReturn(
    manager: EntityManager,
    partial: DeepPartial<PurchaseReturn>,
  ): Promise<PurchaseReturn> {
    const repo = manager.getRepository(PurchaseReturn);
    return repo.save(repo.create(partial));
  }

  async insertReturnItem(
    manager: EntityManager,
    partial: DeepPartial<PurchaseReturnItem>,
  ): Promise<PurchaseReturnItem> {
    const repo = manager.getRepository(PurchaseReturnItem);
    return repo.save(repo.create(partial));
  }
}
