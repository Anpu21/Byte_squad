import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';

export type StockStatus = 'in' | 'low' | 'out';

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sellingPrice: number;
  imageUrl: string | null;
  stockStatus: StockStatus;
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
  inv_quantity: number;
  inv_low_stock_threshold: number;
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
      .innerJoin(
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
    return rows.map((row) => this.toShopProductFromRaw(row));
  }

  async getCategories(branchId: string): Promise<string[]> {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .innerJoin(
        Inventory,
        'inv',
        'inv.product_id = p.id AND inv.branch_id = :branchId',
        { branchId },
      )
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
    if (branchId) {
      const inv = await this.inventoryRepo.findOne({
        where: { productId: id, branchId },
      });
      if (!inv) {
        throw new NotFoundException('Product not available at this branch');
      }
      stockStatus = this.computeStatus(inv.quantity, inv.lowStockThreshold);
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      sellingPrice: Number(product.sellingPrice),
      imageUrl: product.imageUrl,
      stockStatus,
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

  private toShopProductFromRaw(row: ProductWithStockRow): ShopProduct {
    const quantity = Number(row.inv_quantity);
    const threshold = Number(row.inv_low_stock_threshold);
    return {
      id: row.p_id,
      name: row.p_name,
      description: row.p_description,
      category: row.p_category,
      sellingPrice: Number(row.p_selling_price),
      imageUrl: row.p_image_url,
      stockStatus: this.computeStatus(quantity, threshold),
    };
  }

  private computeStatus(quantity: number, threshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'in';
  }
}
