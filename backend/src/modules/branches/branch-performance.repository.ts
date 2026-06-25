import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';
import { Expense } from '@/modules/accounting-core/entities/expense.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';

export interface BranchPerformanceRanges {
  todayStart: Date;
  todayEnd: Date;
  weekStart: Date;
  monthStart: Date;
  monthEnd: Date;
  monthStartDate: string;
  monthEndDate: string;
}

/**
 * Read-side cross-module aggregation for a branch's performance dashboard
 * (BranchesService.getMyPerformance). Keeps the bespoke User/Sale/SaleItem/
 * Inventory/Expense queries out of the service (Rules §7 / blaxx nestjs-00 —
 * no TypeORM in services). DataSource-injected, no @InjectRepository.
 */
@Injectable()
export class BranchPerformanceRepository {
  private readonly users: Repository<User>;
  private readonly sales: Repository<Sale>;
  private readonly saleItems: Repository<SaleItem>;
  private readonly inventory: Repository<Inventory>;
  private readonly expenses: Repository<Expense>;

  constructor(private readonly dataSource: DataSource) {
    this.users = dataSource.getRepository(User);
    this.sales = dataSource.getRepository(Sale);
    this.saleItems = dataSource.getRepository(SaleItem);
    this.inventory = dataSource.getRepository(Inventory);
    this.expenses = dataSource.getRepository(Expense);
  }

  async getPerformanceData(branchId: string, ranges: BranchPerformanceRanges) {
    const {
      todayStart,
      todayEnd,
      weekStart,
      monthStart,
      monthEnd,
      monthStartDate,
      monthEndDate,
    } = ranges;

    const [
      adminUser,
      allStaff,
      todayAgg,
      weekTxns,
      monthTxnsAgg,
      monthExpensesAgg,
      inventoryStats,
      topProductsRaw,
      lowStockRaw,
      recentTxnsRaw,
    ] = await Promise.all([
      this.users.findOne({
        where: { branchId, role: UserRole.ADMIN },
        order: { createdAt: 'ASC' },
      }),
      this.users.find({
        where: { branchId },
        select: ['id', 'role'],
      }),
      this.sales
        .createQueryBuilder('txn')
        .select('COALESCE(SUM(txn.total), 0)', 'total')
        .addSelect('COUNT(txn.id)', 'count')
        .where('txn.branch_id = :branchId', { branchId })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at BETWEEN :start AND :end', {
          start: todayStart,
          end: todayEnd,
        })
        .getRawOne<{ total: string; count: string }>(),
      this.sales
        .createQueryBuilder('txn')
        .select('txn.created_at', 'createdAt')
        .addSelect('txn.total', 'total')
        .where('txn.branch_id = :branchId', { branchId })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at >= :start', { start: weekStart })
        .getRawMany<{ createdAt: Date; total: string }>(),
      this.sales
        .createQueryBuilder('txn')
        .select('COALESCE(SUM(txn.total), 0)', 'total')
        .addSelect('COUNT(txn.id)', 'count')
        .where('txn.branch_id = :branchId', { branchId })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne<{ total: string; count: string }>(),
      this.expenses
        .createQueryBuilder('exp')
        .select('COALESCE(SUM(exp.amount), 0)', 'total')
        .where('exp.branch_id = :branchId', { branchId })
        .andWhere('exp.expense_date BETWEEN :start AND :end', {
          start: monthStartDate,
          end: monthEndDate,
        })
        .getRawOne<{ total: string }>(),
      this.inventory
        .createQueryBuilder('inv')
        .select('COUNT(inv.id)', 'total')
        .addSelect(
          'SUM(CASE WHEN inv.quantity > 0 THEN 1 ELSE 0 END)',
          'active',
        )
        .addSelect(
          'SUM(CASE WHEN inv.quantity <= inv.low_stock_threshold THEN 1 ELSE 0 END)',
          'low',
        )
        .addSelect(
          'SUM(CASE WHEN inv.quantity = 0 THEN 1 ELSE 0 END)',
          'outOfStock',
        )
        .where('inv.branch_id = :branchId', { branchId })
        .getRawOne<{
          total: string;
          active: string;
          low: string;
          outOfStock: string;
        }>(),
      this.saleItems
        .createQueryBuilder('item')
        .innerJoin('item.sale', 'txn')
        .innerJoin('item.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'name')
        .addSelect('SUM(item.quantity)', 'quantity')
        .addSelect('SUM(item.line_total)', 'revenue')
        .where('txn.branch_id = :branchId', { branchId })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at >= :start', { start: monthStart })
        .groupBy('product.id')
        .addGroupBy('product.name')
        .orderBy('SUM(item.line_total)', 'DESC')
        .limit(5)
        .getRawMany<{
          productId: string;
          name: string;
          quantity: string;
          revenue: string;
        }>(),
      this.inventory
        .createQueryBuilder('inv')
        .innerJoin('inv.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'name')
        .addSelect('inv.quantity', 'quantity')
        .addSelect('inv.low_stock_threshold', 'threshold')
        .where('inv.branch_id = :branchId', { branchId })
        .andWhere('inv.quantity <= inv.low_stock_threshold')
        .orderBy('inv.quantity', 'ASC')
        .limit(10)
        .getRawMany<{
          productId: string;
          name: string;
          quantity: string;
          threshold: string;
        }>(),
      this.sales.find({
        where: { branchId },
        relations: ['cashier'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      adminUser,
      allStaff,
      todayAgg,
      weekTxns,
      monthTxnsAgg,
      monthExpensesAgg,
      inventoryStats,
      topProductsRaw,
      lowStockRaw,
      recentTxnsRaw,
    };
  }
}
