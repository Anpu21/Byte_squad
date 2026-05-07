import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';

export type StockStatus = 'in' | 'low' | 'out';

export interface ShopProductBranchRef {
  id: string;
  name: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sellingPrice: number;
  imageUrl: string | null;
  stockStatus: StockStatus;
  availableBranches: ShopProductBranchRef[];
}

export interface ShopBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface ListProductsQuery {
  branchId: string;
  category?: string;
  search?: string;
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

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
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
    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
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
