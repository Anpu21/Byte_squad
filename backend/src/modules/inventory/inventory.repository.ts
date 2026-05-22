import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { Inventory } from '@inventory/entities/inventory.entity';

import {
  StockStatus,
  FindByBranchOptions,
  PagedInventory,
} from '@inventory/types';

// Re-export so the service can keep importing from the repo path.
export type { StockStatus, FindByBranchOptions, PagedInventory };

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
  ) {}

  async createAndSave(partial: DeepPartial<Inventory>): Promise<Inventory> {
    return this.repo.save(this.repo.create(partial));
  }

  async update(id: string, partial: DeepPartial<Inventory>): Promise<void> {
    await this.repo.update(id, partial);
  }

  async findById(id: string): Promise<Inventory | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['product', 'branch'],
    });
  }

  async findByProductAndBranch(
    productId: string,
    branchId: string,
  ): Promise<Inventory | null> {
    return this.repo.findOne({ where: { productId, branchId } });
  }

  async findByProductInBranches(
    productId: string,
    branchIds: readonly string[],
  ): Promise<Inventory[]> {
    if (branchIds.length === 0) return [];
    return this.repo.find({
      where: { productId, branchId: In([...branchIds]) },
    });
  }

  async findByProductIds(productIds: readonly string[]): Promise<Inventory[]> {
    if (productIds.length === 0) return [];
    return this.repo.find({ where: { productId: In([...productIds]) } });
  }

  async countActiveForBranch(branchId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('inv')
      .where('inv.branch_id = :branchId', { branchId })
      .andWhere('inv.quantity > 0')
      .getCount();
  }

  async decrementStock(
    productId: string,
    branchId: string,
    quantity: number,
  ): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Inventory)
      .set({ quantity: () => `"quantity" - ${quantity}` })
      .where('product_id = :productId', { productId })
      .andWhere('branch_id = :branchId', { branchId })
      .andWhere('quantity >= :quantity', { quantity })
      .execute();
    return Number(result.affected ?? 0) > 0;
  }

  async decrementStockBatch(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<{ ok: boolean; failedProductId: string | null }> {
    let failedProductId: string | null = null;
    try {
      await this.repo.manager.transaction(async (manager) => {
        for (const item of items) {
          const result = await manager
            .createQueryBuilder()
            .update(Inventory)
            .set({ quantity: () => `"quantity" - ${item.quantity}` })
            .where('product_id = :productId', { productId: item.productId })
            .andWhere('branch_id = :branchId', { branchId })
            .andWhere('quantity >= :quantity', { quantity: item.quantity })
            .execute();
          if (Number(result.affected ?? 0) === 0) {
            failedProductId = item.productId;
            throw new Error('INSUFFICIENT_STOCK');
          }
        }
      });
      return { ok: true, failedProductId: null };
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INSUFFICIENT_STOCK') {
        return { ok: false, failedProductId };
      }
      throw err;
    }
  }

  async countLowStockForBranch(branchId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('inv')
      .where('inv.branch_id = :branchId', { branchId })
      .andWhere('inv.quantity <= inv.low_stock_threshold')
      .getCount();
  }

  async findLowStock(): Promise<Inventory[]> {
    return this.repo
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.branch', 'branch')
      .where('inventory.quantity <= inventory.low_stock_threshold')
      .getMany();
  }

  async findByBranchPaged(opts: FindByBranchOptions): Promise<PagedInventory> {
    const qb = this.repo
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.branch_id = :branchId', { branchId: opts.branchId })
      .andWhere('product.is_active = true');

    if (opts.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${opts.search}%` },
      );
    }
    if (opts.category) {
      qb.andWhere('product.category = :category', { category: opts.category });
    }
    if (opts.stockStatus) {
      switch (opts.stockStatus) {
        case 'in_stock':
          qb.andWhere('inventory.quantity > inventory.low_stock_threshold');
          break;
        case 'low_stock':
          qb.andWhere(
            'inventory.quantity > 0 AND inventory.quantity <= inventory.low_stock_threshold',
          );
          break;
        case 'out_of_stock':
          qb.andWhere('inventory.quantity = 0');
          break;
      }
    }

    const [items, total] = await qb
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getManyAndCount();

    return {
      items,
      total,
      page: opts.page,
      limit: opts.limit,
      totalPages: Math.ceil(total / opts.limit),
    };
  }
}
