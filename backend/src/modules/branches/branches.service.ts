import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';

export interface MyBranchInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MyBranchAdmin {
  name: string;
  email: string;
}

export interface MyBranchTodayKpis {
  sales: number;
  transactions: number;
  avgTransaction: number;
}

export interface MyBranchDailyPoint {
  date: string;
  sales: number;
  transactions: number;
}

export interface MyBranchWeekKpis {
  sales: number;
  transactions: number;
  dailyBreakdown: MyBranchDailyPoint[];
}

export interface MyBranchMonthKpis {
  revenue: number;
  expenses: number;
  netProfit: number;
  transactions: number;
}

export interface MyBranchStaff {
  total: number;
  byRole: {
    admin: number;
    manager: number;
    accountant: number;
    cashier: number;
  };
}

export interface MyBranchInventory {
  totalProducts: number;
  activeProducts: number;
  lowStockItems: number;
  outOfStock: number;
}

export interface MyBranchTopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface MyBranchLowStockItem {
  productId: string;
  name: string;
  quantity: number;
  threshold: number;
}

export interface MyBranchRecentTransaction {
  id: string;
  transactionNumber: string;
  total: number;
  cashierName: string;
  createdAt: Date;
}

export interface MyBranchPerformance {
  branch: MyBranchInfo;
  admin: MyBranchAdmin | null;
  today: MyBranchTodayKpis;
  week: MyBranchWeekKpis;
  month: MyBranchMonthKpis;
  staff: MyBranchStaff;
  inventory: MyBranchInventory;
  topProducts: MyBranchTopProduct[];
  lowStockList: MyBranchLowStockItem[];
  recentTransactions: MyBranchRecentTransaction[];
}

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchRepository.create(createBranchDto);
    return this.branchRepository.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find();
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branchRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.branchRepository.update(id, dto);
    const updated = await this.branchRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException('Branch not found');
    }
    return updated;
  }

  async toggleActive(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    branch.isActive = !branch.isActive;
    return this.branchRepository.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.branchRepository.delete(id);
  }

  async getMyPerformance(branchId: string): Promise<MyBranchPerformance> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthStartDate = monthStart.toISOString().split('T')[0];
    const monthEndDate = monthEnd.toISOString().split('T')[0];

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
      this.userRepository.findOne({
        where: { branchId, role: UserRole.ADMIN },
        order: { createdAt: 'ASC' },
      }),
      this.userRepository.find({
        where: { branchId },
        select: ['id', 'role'],
      }),
      this.transactionRepository
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
      this.transactionRepository
        .createQueryBuilder('txn')
        .select('txn.created_at', 'createdAt')
        .addSelect('txn.total', 'total')
        .where('txn.branch_id = :branchId', { branchId })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at >= :start', { start: weekStart })
        .getRawMany<{ createdAt: Date; total: string }>(),
      this.transactionRepository
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
      this.expenseRepository
        .createQueryBuilder('exp')
        .select('COALESCE(SUM(exp.amount), 0)', 'total')
        .where('exp.branch_id = :branchId', { branchId })
        .andWhere('exp.expense_date BETWEEN :start AND :end', {
          start: monthStartDate,
          end: monthEndDate,
        })
        .getRawOne<{ total: string }>(),
      this.inventoryRepository
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
      this.transactionItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.transaction', 'txn')
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
      this.inventoryRepository
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
      this.transactionRepository.find({
        where: { branchId },
        relations: ['cashier'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    // Staff breakdown by role
    const staff: MyBranchStaff = {
      total: allStaff.length,
      byRole: {
        admin: allStaff.filter((u) => u.role === UserRole.ADMIN).length,
        manager: allStaff.filter((u) => u.role === UserRole.MANAGER).length,
        accountant: allStaff.filter((u) => u.role === UserRole.ACCOUNTANT)
          .length,
        cashier: allStaff.filter((u) => u.role === UserRole.CASHIER).length,
      },
    };

    // Weekly daily breakdown — seed 7 days, fold txn totals in
    const dailyMap = new Map<string, { sales: number; transactions: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { sales: 0, transactions: 0 });
    }
    let weekSales = 0;
    for (const row of weekTxns) {
      const key = new Date(row.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      const total = Number(row.total);
      weekSales += total;
      if (entry) {
        entry.sales += total;
        entry.transactions += 1;
      }
    }

    const dailyBreakdown: MyBranchDailyPoint[] = [];
    for (const [date, data] of dailyMap) {
      dailyBreakdown.push({
        date,
        sales: Math.round(data.sales * 100) / 100,
        transactions: data.transactions,
      });
    }

    const todaySales = Number(todayAgg?.total ?? 0);
    const todayCount = Number(todayAgg?.count ?? 0);

    const monthRevenue = Number(monthTxnsAgg?.total ?? 0);
    const monthExpenses = Number(monthExpensesAgg?.total ?? 0);
    const monthTransactions = Number(monthTxnsAgg?.count ?? 0);

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        isActive: branch.isActive,
        createdAt: branch.createdAt,
      },
      admin: adminUser
        ? {
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email,
          }
        : null,
      today: {
        sales: Math.round(todaySales * 100) / 100,
        transactions: todayCount,
        avgTransaction:
          todayCount > 0
            ? Math.round((todaySales / todayCount) * 100) / 100
            : 0,
      },
      week: {
        sales: Math.round(weekSales * 100) / 100,
        transactions: weekTxns.length,
        dailyBreakdown,
      },
      month: {
        revenue: Math.round(monthRevenue * 100) / 100,
        expenses: Math.round(monthExpenses * 100) / 100,
        netProfit: Math.round((monthRevenue - monthExpenses) * 100) / 100,
        transactions: monthTransactions,
      },
      staff,
      inventory: {
        totalProducts: Number(inventoryStats?.total ?? 0),
        activeProducts: Number(inventoryStats?.active ?? 0),
        lowStockItems: Number(inventoryStats?.low ?? 0),
        outOfStock: Number(inventoryStats?.outOfStock ?? 0),
      },
      topProducts: topProductsRaw.map((p) => ({
        productId: p.productId,
        name: p.name,
        quantity: Number(p.quantity ?? 0),
        revenue: Math.round(Number(p.revenue ?? 0) * 100) / 100,
      })),
      lowStockList: lowStockRaw.map((r) => ({
        productId: r.productId,
        name: r.name,
        quantity: Number(r.quantity),
        threshold: Number(r.threshold),
      })),
      recentTransactions: recentTxnsRaw.map((t) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        total: Number(t.total),
        cashierName: t.cashier
          ? `${t.cashier.firstName} ${t.cashier.lastName}`
          : 'Unknown',
        createdAt: t.createdAt,
      })),
    };
  }
}
