import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { User } from '@users/entities/user.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';

import {
  StockStatus,
  ShopProductBranchRef,
  ShopProduct,
  ShopBranch,
} from '@/modules/shop/types';

// Re-export so existing callers that imported these from this file keep working.
export type { StockStatus, ShopProductBranchRef, ShopProduct, ShopBranch };

interface ListProductsQuery {
  branchId: string;
  category?: string;
  search?: string;
}

interface ListRecommendedQuery {
  branchId: string;
  productId?: string;
  category?: string;
  limit?: number;
}

interface ProductWithStockRow {
  p_id: string;
  p_name: string;
  p_description: string | null;
  p_category: string;
  p_selling_price: string;
  p_image_url: string | null;
  inv_quantity: number | null;
  inv_low_stock_threshold: number | null;
}

interface OtherBranchRow {
  product_id: string;
  branch_id: string;
  branch_name: string;
}

interface TopSellerRow {
  productId: string;
  totalQuantity: string;
}

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
  ) {}

  async listProducts(query: ListProductsQuery): Promise<ShopProduct[]> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoin(
        Inventory,
        'inv',
        'inv.product_id = p.id AND inv.branch_id = :branchId',
        { branchId: query.branchId },
      )
      .select([
        'p.id AS p_id',
        'p.name AS p_name',
        'p.description AS p_description',
        'p.category AS p_category',
        'p.selling_price AS p_selling_price',
        'p.image_url AS p_image_url',
        'inv.quantity AS inv_quantity',
        'inv.low_stock_threshold AS inv_low_stock_threshold',
      ])
      .where('p.is_active = :isActive', { isActive: true })
      .orderBy('p.name', 'ASC');

    if (query.category) {
      qb.andWhere('p.category = :category', { category: query.category });
    }
    if (query.search) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        "(LOWER(p.name) LIKE LOWER(:term) OR LOWER(COALESCE(p.description, '')) LIKE LOWER(:term))",
        { term },
      );
    }

    const rows = await qb.getRawMany<ProductWithStockRow>();

    const outProductIds = rows
      .filter((r) => this.computeStatusFromRow(r) === 'out')
      .map((r) => r.p_id);

    const otherBranchesByProduct = await this.lookupOtherBranches(
      outProductIds,
      query.branchId,
    );

    return rows.map((row) => {
      const stockStatus = this.computeStatusFromRow(row);
      return {
        id: row.p_id,
        name: row.p_name,
        description: row.p_description,
        category: row.p_category,
        sellingPrice: Number(row.p_selling_price),
        imageUrl: row.p_image_url,
        stockStatus,
        availableBranches:
          stockStatus === 'out'
            ? (otherBranchesByProduct.get(row.p_id) ?? [])
            : [],
      };
    });
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.is_active = :isActive', { isActive: true })
      .orderBy('p.category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category).filter((c): c is string => Boolean(c));
  }

  async listRecommended(
    query: ListRecommendedQuery,
  ): Promise<ShopProduct[]> {
    const limit = query.limit ?? 8;
    const contextProduct = query.productId
      ? await this.productRepo.findOne({
          where: { id: query.productId, isActive: true },
        })
      : null;
    const category = query.category ?? contextProduct?.category ?? null;
    const availableProducts = (await this.listProducts({ branchId: query.branchId }))
      .filter((product) => product.stockStatus !== 'out')
      .filter((product) => product.id !== query.productId);

    const topSellerRows = await this.transactionItemRepo
      .createQueryBuilder('ti')
      .select('ti.product_id', 'productId')
      .addSelect('SUM(ti.quantity)', 'totalQuantity')
      .innerJoin('ti.transaction', 'txn')
      .where('txn.branch_id = :branchId', { branchId: query.branchId })
      .andWhere('txn.type = :type', { type: TransactionType.SALE })
      .groupBy('ti.product_id')
      .orderBy('SUM(ti.quantity)', 'DESC')
      .limit(50)
      .getRawMany<TopSellerRow>();
    const topSellerRank = new Map<string, number>();
    topSellerRows.forEach((row, index) => {
      topSellerRank.set(row.productId, 500 - index);
    });

    return availableProducts
      .map((product) => ({
        product,
        score:
          (category && product.category === category ? 1000 : 0) +
          (topSellerRank.get(product.id) ?? 0),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.product.name.localeCompare(b.product.name);
      })
      .slice(0, limit)
      .map((entry) => entry.product);
  }

  async getProduct(id: string, branchId?: string): Promise<ShopProduct> {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let stockStatus: StockStatus = 'out';
    let availableBranches: ShopProductBranchRef[] = [];

    if (branchId) {
      const inv = await this.inventoryRepo.findOne({
        where: { productId: id, branchId },
      });
      stockStatus = inv
        ? this.computeStatus(inv.quantity, inv.lowStockThreshold)
        : 'out';
      if (stockStatus === 'out') {
        const map = await this.lookupOtherBranches([id], branchId);
        availableBranches = map.get(id) ?? [];
      }
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      sellingPrice: Number(product.sellingPrice),
      imageUrl: product.imageUrl,
      stockStatus,
      availableBranches,
    };
  }

  async listActiveBranches(): Promise<ShopBranch[]> {
    const branches = await this.branchRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const staffRows = await this.userRepo
      .createQueryBuilder('u')
      .select('u.branch_id', 'branchId')
      .addSelect('COUNT(u.id)', 'count')
      .where('u.role IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
      })
      .andWhere('u.branch_id IS NOT NULL')
      .groupBy('u.branch_id')
      .getRawMany<{ branchId: string; count: string }>();

    const countByBranch = new Map<string, number>();
    for (const row of staffRows) {
      countByBranch.set(row.branchId, Number(row.count));
    }

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      staffCount: countByBranch.get(b.id) ?? 0,
    }));
  }

  private async lookupOtherBranches(
    productIds: string[],
    excludeBranchId: string,
  ): Promise<Map<string, ShopProductBranchRef[]>> {
    const map = new Map<string, ShopProductBranchRef[]>();
    if (productIds.length === 0) return map;

    const rows = await this.inventoryRepo
      .createQueryBuilder('inv')
      .innerJoin(Branch, 'b', 'b.id = inv.branch_id')
      .select([
        'inv.product_id AS product_id',
        'inv.branch_id AS branch_id',
        'b.name AS branch_name',
      ])
      .where('inv.product_id IN (:...productIds)', { productIds })
      .andWhere('inv.quantity > 0')
      .andWhere('inv.branch_id != :excludeBranchId', { excludeBranchId })
      .andWhere('b.is_active = :isActive', { isActive: true })
      .orderBy('b.name', 'ASC')
      .getRawMany<OtherBranchRow>();

    for (const row of rows) {
      const list = map.get(row.product_id) ?? [];
      list.push({ id: row.branch_id, name: row.branch_name });
      map.set(row.product_id, list);
    }
    return map;
  }

  private computeStatusFromRow(row: ProductWithStockRow): StockStatus {
    if (row.inv_quantity === null || row.inv_quantity === undefined) {
      return 'out';
    }
    const quantity = Number(row.inv_quantity);
    const threshold = Number(row.inv_low_stock_threshold ?? 0);
    return this.computeStatus(quantity, threshold);
  }

  private computeStatus(quantity: number, threshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'in';
  }
}
