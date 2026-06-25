import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { User } from '@users/entities/user.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';

export interface ProductWithStockRow {
  p_id: string;
  p_name: string;
  p_description: string | null;
  p_category: string;
  p_selling_price: string;
  p_image_url: string | null;
  p_base_unit: string;
  inv_quantity: number | null;
  inv_low_stock_threshold: number | null;
}

export interface OtherBranchRow {
  product_id: string;
  branch_id: string;
  branch_name: string;
}

export interface TopSellerRow {
  productId: string;
  totalQuantity: string;
}

export interface ProductFilter {
  branchId: string;
  category?: string;
  search?: string;
}

/**
 * Read-side data access for the customer storefront. The shop service is a
 * cross-domain facade (products, inventory, branches, users, sales) — keeping
 * all of its TypeORM here (DataSource-injected, no @InjectRepository) leaves
 * the service to pure presentation/business logic. blaxx nestjs-00 §7.
 */
@Injectable()
export class ShopReadRepository {
  private readonly products: Repository<Product>;
  private readonly branches: Repository<Branch>;
  private readonly inventory: Repository<Inventory>;
  private readonly users: Repository<User>;
  private readonly saleItems: Repository<SaleItem>;
  private readonly sellableUnits: Repository<ProductSellableUnit>;

  constructor(private readonly dataSource: DataSource) {
    this.products = dataSource.getRepository(Product);
    this.branches = dataSource.getRepository(Branch);
    this.inventory = dataSource.getRepository(Inventory);
    this.users = dataSource.getRepository(User);
    this.saleItems = dataSource.getRepository(SaleItem);
    this.sellableUnits = dataSource.getRepository(ProductSellableUnit);
  }

  async productsWithStock(
    filter: ProductFilter,
  ): Promise<ProductWithStockRow[]> {
    const qb = this.products
      .createQueryBuilder('p')
      .leftJoin(
        Inventory,
        'inv',
        'inv.product_id = p.id AND inv.branch_id = :branchId',
        { branchId: filter.branchId },
      )
      .select([
        'p.id AS p_id',
        'p.name AS p_name',
        'p.description AS p_description',
        'p.category AS p_category',
        'p.selling_price AS p_selling_price',
        'p.image_url AS p_image_url',
        'p.base_unit AS p_base_unit',
        'inv.quantity AS inv_quantity',
        'inv.low_stock_threshold AS inv_low_stock_threshold',
      ])
      .where('p.is_active = :isActive', { isActive: true })
      .orderBy('p.name', 'ASC');

    if (filter.category) {
      qb.andWhere('p.category = :category', { category: filter.category });
    }
    if (filter.search) {
      const term = `%${filter.search.trim()}%`;
      qb.andWhere(
        "(LOWER(p.name) LIKE LOWER(:term) OR LOWER(COALESCE(p.description, '')) LIKE LOWER(:term))",
        { term },
      );
    }

    return qb.getRawMany<ProductWithStockRow>();
  }

  async distinctCategories(): Promise<{ category: string }[]> {
    return this.products
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.is_active = :isActive', { isActive: true })
      .orderBy('p.category', 'ASC')
      .getRawMany<{ category: string }>();
  }

  async findActiveProduct(id: string): Promise<Product | null> {
    return this.products.findOne({ where: { id, isActive: true } });
  }

  async findActiveProductWithUnits(id: string): Promise<Product | null> {
    return this.products.findOne({
      where: { id, isActive: true },
      relations: ['sellableUnits'],
    });
  }

  async topSellers(branchId: string): Promise<TopSellerRow[]> {
    return this.saleItems
      .createQueryBuilder('ti')
      .select('ti.product_id', 'productId')
      .addSelect('SUM(ti.quantity)', 'totalQuantity')
      .innerJoin('ti.sale', 'txn')
      .where('txn.branch_id = :branchId', { branchId })
      .andWhere('txn.type = :type', { type: TransactionType.SALE })
      .groupBy('ti.product_id')
      .orderBy('SUM(ti.quantity)', 'DESC')
      .limit(50)
      .getRawMany<TopSellerRow>();
  }

  async findInventory(
    productId: string,
    branchId: string,
  ): Promise<Inventory | null> {
    return this.inventory.findOne({ where: { productId, branchId } });
  }

  async activeBranches(): Promise<Branch[]> {
    return this.branches.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async staffCountsByBranch(): Promise<{ branchId: string; count: string }[]> {
    return this.users
      .createQueryBuilder('u')
      .select('u.branch_id', 'branchId')
      .addSelect('COUNT(u.id)', 'count')
      .where('u.role IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
      })
      .andWhere('u.branch_id IS NOT NULL')
      .groupBy('u.branch_id')
      .getRawMany<{ branchId: string; count: string }>();
  }

  async sellableUnitsFor(productIds: string[]): Promise<ProductSellableUnit[]> {
    return this.sellableUnits.find({
      where: { productId: In(productIds) },
      order: { displayOrder: 'ASC' },
    });
  }

  async otherBranchesWithStock(
    productIds: string[],
    excludeBranchId: string,
  ): Promise<OtherBranchRow[]> {
    return this.inventory
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
  }
}
