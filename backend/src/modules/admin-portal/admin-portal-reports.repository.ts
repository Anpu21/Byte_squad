import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { Product } from '@products/entities/product.entity';
import { Expense } from '@/modules/accounting-core/entities/expense.entity';
import { TransactionType } from '@common/enums/transaction.enum';

export interface BranchSalesAggregate {
  total: string;
  count: string;
}

export interface BranchTopProductRow {
  productId: string;
  productName: string;
  quantity: string;
  revenue: string;
}

export interface InventoryMatrixProductFilter {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

/**
 * Read-side cross-domain aggregations for the admin portal (overview, per-branch
 * comparison, inventory matrix). admin-portal owns no entity of its own, so its
 * bespoke sales × products × expenses queries live here — DataSource-injected,
 * no @InjectRepository, no TypeORM in the service. blaxx nestjs-00 §7.
 */
@Injectable()
export class AdminPortalReportsRepository {
  private readonly sales: Repository<Sale>;
  private readonly saleItems: Repository<SaleItem>;
  private readonly products: Repository<Product>;
  private readonly expenses: Repository<Expense>;

  constructor(private readonly dataSource: DataSource) {
    this.sales = dataSource.getRepository(Sale);
    this.saleItems = dataSource.getRepository(SaleItem);
    this.products = dataSource.getRepository(Product);
    this.expenses = dataSource.getRepository(Expense);
  }

  /** Sales total + transaction count for a branch over a date range. */
  async branchSalesAggregate(
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<BranchSalesAggregate | undefined> {
    return this.sales
      .createQueryBuilder('txn')
      .select('COALESCE(SUM(txn.total), 0)', 'total')
      .addSelect('COUNT(txn.id)', 'count')
      .where('txn.branch_id = :branchId', { branchId })
      .andWhere('txn.type = :type', { type: TransactionType.SALE })
      .andWhere('txn.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne<BranchSalesAggregate>();
  }

  /** Total expenses for a branch over a date range. */
  async branchExpensesTotal(
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<{ total: string } | undefined> {
    return this.expenses
      .createQueryBuilder('exp')
      .select('COALESCE(SUM(exp.amount), 0)', 'total')
      .where('exp.branch_id = :branchId', { branchId })
      .andWhere('exp.expense_date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();
  }

  /** Top 5 products by revenue for a branch over a date range. */
  async branchTopProducts(
    branchId: string,
    start: Date,
    end: Date,
  ): Promise<BranchTopProductRow[]> {
    return this.saleItems
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'txn')
      .innerJoin('item.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.line_total)', 'revenue')
      .where('txn.branch_id = :branchId', { branchId })
      .andWhere('txn.type = :type', { type: TransactionType.SALE })
      .andWhere('txn.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('SUM(item.line_total)', 'DESC')
      .limit(5)
      .getRawMany<BranchTopProductRow>();
  }

  /**
   * Active products for the inventory matrix. With `lowStockOnly` the full
   * filtered list is returned (post-filtered + paginated in JS by the service,
   * since the flag depends on per-branch thresholds); otherwise SQL paginates.
   */
  async findProductsForMatrix(
    filter: InventoryMatrixProductFilter,
    offset: number,
    limit: number,
  ): Promise<{ products: Product[]; total: number }> {
    const productQb = this.products
      .createQueryBuilder('p')
      .where('p.is_active = :active', { active: true })
      .orderBy('p.name', 'ASC');

    if (filter.search) {
      productQb.andWhere('(p.name ILIKE :q OR p.barcode ILIKE :q)', {
        q: `%${filter.search}%`,
      });
    }
    if (filter.category) {
      productQb.andWhere('p.category = :category', {
        category: filter.category,
      });
    }

    if (filter.lowStockOnly) {
      const products = await productQb.getMany();
      return { products, total: 0 };
    }
    const [products, total] = await productQb
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { products, total };
  }
}
