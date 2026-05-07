import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Product } from '@products/entities/product.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { InventoryMatrixQueryDto } from '@admin-portal/dto/inventory-matrix-query.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  isActive: boolean;
  todaySales: number;
  todayTransactions: number;
  staffCount: number;
  activeProducts: number;
  lowStockItems: number;
  adminName: string | null;
}

export interface OverviewSummary {
  totalRevenueToday: number;
  totalTransactionsToday: number;
  activeBranches: number;
  inactiveBranches: number;
  totalStaff: number;
}

export interface OverviewAlert {
  type:
    | 'no_admin'
    | 'no_transactions'
    | 'critical_low_stock'
    | 'inactive_branch';
  branchId: string;
  branchName: string;
  message: string;
}

export interface OverviewResponse {
  summary: OverviewSummary;
  branches: BranchPerformance[];
  alerts: OverviewAlert[];
}

export interface BranchWithMeta {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  adminName: string | null;
  adminEmail: string | null;
  staffCount: number;
}

export interface AdminWithBranch {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string;
  branchName: string | null;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserWithBranch {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string;
  branchName: string | null;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface BranchComparisonEntry {
  branchId: string;
  branchName: string;
  revenue: number;
  expenses: number;
  expenseRatio: number;
  transactionCount: number;
  avgTransactionValue: number;
  staffCount: number;
  revenuePerStaff: number;
  topProducts: TopProduct[];
}

export interface BranchComparisonResponse {
  startDate: string;
  endDate: string;
  branches: BranchComparisonEntry[];
}

export interface InventoryMatrixBranchColumn {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InventoryMatrixCell {
  branchId: string;
  inventoryId: string | null;
  quantity: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastRestockedAt: Date | null;
}

export interface InventoryMatrixRow {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  cells: InventoryMatrixCell[];
  totalQuantity: number;
}

export interface InventoryMatrixResponse {
  branches: InventoryMatrixBranchColumn[];
  rows: InventoryMatrixRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AdminPortalService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  async getOverview(): Promise<OverviewResponse> {
    const branches = await this.branchRepo.find({ order: { name: 'ASC' } });

    const { start: todayStart, end: todayEnd } = this.getTodayRange();

    const performance = await Promise.all(
      branches.map((b) => this.getBranchPerformance(b, todayStart, todayEnd)),
    );

    const summary: OverviewSummary = {
      totalRevenueToday: performance.reduce((sum, p) => sum + p.todaySales, 0),
      totalTransactionsToday: performance.reduce(
        (sum, p) => sum + p.todayTransactions,
        0,
      ),
      activeBranches: branches.filter((b) => b.isActive).length,
      inactiveBranches: branches.filter((b) => !b.isActive).length,
      totalStaff: performance.reduce((sum, p) => sum + p.staffCount, 0),
    };

    const alerts = this.buildAlerts(performance);

    return { summary, branches: performance, alerts };
  }

  async listBranchesWithMeta(): Promise<BranchWithMeta[]> {
    const branches = await this.branchRepo.find({ order: { name: 'ASC' } });

    return Promise.all(
      branches.map(async (branch) => {
        const [admin, staffCount] = await Promise.all([
          this.userRepo.findOne({
            where: { branchId: branch.id, role: UserRole.ADMIN },
            order: { createdAt: 'ASC' },
          }),
          this.userRepo.count({ where: { branchId: branch.id } }),
        ]);

        return {
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          isActive: branch.isActive,
          createdAt: branch.createdAt,
          updatedAt: branch.updatedAt,
          adminName: admin ? `${admin.firstName} ${admin.lastName}` : null,
          adminEmail: admin ? admin.email : null,
          staffCount,
        };
      }),
    );
  }

  async listAllUsers(): Promise<UserWithBranch[]> {
    const users = await this.userRepo.find({
      relations: ['branch'],
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      branchId: u.branchId,
      branchName: u.branch?.name ?? null,
      isVerified: u.isVerified,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  }

  async getBranchComparison(
    branchIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<BranchComparisonResponse> {
    if (branchIds.length < 1) {
      throw new BadRequestException('At least one branch is required');
    }
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const branches = await this.branchRepo.find({
      where: { id: In(branchIds) },
    });

    if (branches.length === 0) {
      throw new BadRequestException('No matching branches found');
    }

    // Preserve caller's branch order
    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const orderedBranches = branchIds
      .map((id) => branchMap.get(id))
      .filter((b): b is Branch => !!b);

    const entries = await Promise.all(
      orderedBranches.map((b) =>
        this.getBranchComparisonEntry(b, startDate, endDate),
      ),
    );

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branches: entries,
    };
  }

  async listAdmins(): Promise<AdminWithBranch[]> {
    const admins = await this.userRepo.find({
      where: { role: UserRole.ADMIN },
      relations: ['branch'],
      order: { createdAt: 'ASC' },
    });

    return admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      branchId: admin.branchId,
      branchName: admin.branch?.name ?? null,
      isVerified: admin.isVerified,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    }));
  }

  async getInventoryMatrix(
    query: InventoryMatrixQueryDto,
  ): Promise<InventoryMatrixResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const offset = (page - 1) * limit;

    const branches = await this.branchRepo.find({ order: { name: 'ASC' } });
    const branchColumns: InventoryMatrixBranchColumn[] = branches.map((b) => ({
      id: b.id,
      name: b.name,
      isActive: b.isActive,
    }));

    const productQb = this.productRepo
      .createQueryBuilder('p')
      .where('p.is_active = :active', { active: true })
      .orderBy('p.name', 'ASC');

    if (query.search) {
      productQb.andWhere('(p.name ILIKE :q OR p.barcode ILIKE :q)', {
        q: `%${query.search}%`,
      });
    }
    if (query.category) {
      productQb.andWhere('p.category = :category', {
        category: query.category,
      });
    }

    // When `lowStockOnly` is set we cannot reliably paginate at the SQL layer
    // because the flag depends on per-branch thresholds in the inventory rows.
    // The callable workload is small (a few thousand products max), so we
    // fetch the full filtered product list and post-filter + paginate in JS.
    let products: Product[];
    let total = 0;

    if (query.lowStockOnly) {
      products = await productQb.getMany();
    } else {
      const [rows, count] = await productQb
        .skip(offset)
        .take(limit)
        .getManyAndCount();
      products = rows;
      total = count;
    }

    if (products.length === 0) {
      return {
        branches: branchColumns,
        rows: [],
        total: query.lowStockOnly ? 0 : (total ?? 0),
        page,
        limit,
        totalPages: 1,
      };
    }

    const productIds = products.map((p) => p.id);
    const inventoryRows = await this.inventoryRepo.find({
      where: { productId: In(productIds) },
    });

    // productId -> branchId -> Inventory
    const inventoryByProduct = new Map<string, Map<string, Inventory>>();
    for (const row of inventoryRows) {
      let inner = inventoryByProduct.get(row.productId);
      if (!inner) {
        inner = new Map<string, Inventory>();
        inventoryByProduct.set(row.productId, inner);
      }
      inner.set(row.branchId, row);
    }

    let assembled: InventoryMatrixRow[] = products.map((p) => {
      const innerMap = inventoryByProduct.get(p.id);
      const cells: InventoryMatrixCell[] = branches.map((b) => {
        const inv = innerMap?.get(b.id) ?? null;
        if (!inv) {
          return {
            branchId: b.id,
            inventoryId: null,
            quantity: 0,
            lowStockThreshold: null,
            isLowStock: false,
            isOutOfStock: true,
            lastRestockedAt: null,
          };
        }
        const isOutOfStock = inv.quantity === 0;
        const isLowStock =
          !isOutOfStock && inv.quantity <= inv.lowStockThreshold;
        return {
          branchId: b.id,
          inventoryId: inv.id,
          quantity: inv.quantity,
          lowStockThreshold: inv.lowStockThreshold,
          isLowStock,
          isOutOfStock,
          lastRestockedAt: inv.lastRestockedAt,
        };
      });
      const totalQuantity = cells.reduce((sum, c) => sum + c.quantity, 0);
      return {
        productId: p.id,
        productName: p.name,
        barcode: p.barcode,
        category: p.category,
        sellingPrice: Number(p.sellingPrice),
        cells,
        totalQuantity,
      };
    });

    if (query.lowStockOnly) {
      assembled = assembled.filter((row) =>
        row.cells.some((c) => c.isLowStock || c.isOutOfStock),
      );
      const filteredTotal = assembled.length;
      const paged = assembled.slice(offset, offset + limit);
      return {
        branches: branchColumns,
        rows: paged,
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
      };
    }

    return {
      branches: branchColumns,
      rows: assembled,
      total: total ?? assembled.length,
      page,
      limit,
      totalPages: Math.ceil((total ?? assembled.length) / limit) || 1,
    };
  }

  // ── Internals ───────────────────────────────────────────

  private async getBranchPerformance(
    branch: Branch,
    todayStart: Date,
    todayEnd: Date,
  ): Promise<BranchPerformance> {
    const [salesAgg, staffCount, activeProducts, lowStockItems, adminUser] =
      await Promise.all([
        this.transactionRepo
          .createQueryBuilder('txn')
          .select('COALESCE(SUM(txn.total), 0)', 'total')
          .addSelect('COUNT(txn.id)', 'count')
          .where('txn.branch_id = :branchId', { branchId: branch.id })
          .andWhere('txn.type = :type', { type: TransactionType.SALE })
          .andWhere('txn.created_at BETWEEN :start AND :end', {
            start: todayStart,
            end: todayEnd,
          })
          .getRawOne<{ total: string; count: string }>(),
        this.userRepo.count({ where: { branchId: branch.id } }),
        this.inventoryRepo
          .createQueryBuilder('inv')
          .where('inv.branch_id = :branchId', { branchId: branch.id })
          .andWhere('inv.quantity > 0')
          .getCount(),
        this.inventoryRepo
          .createQueryBuilder('inv')
          .where('inv.branch_id = :branchId', { branchId: branch.id })
          .andWhere('inv.quantity <= inv.low_stock_threshold')
          .getCount(),
        this.userRepo.findOne({
          where: { branchId: branch.id, role: UserRole.ADMIN },
          order: { createdAt: 'ASC' },
        }),
      ]);

    return {
      branchId: branch.id,
      branchName: branch.name,
      isActive: branch.isActive,
      todaySales: Number(salesAgg?.total ?? 0),
      todayTransactions: Number(salesAgg?.count ?? 0),
      staffCount,
      activeProducts,
      lowStockItems,
      adminName: adminUser
        ? `${adminUser.firstName} ${adminUser.lastName}`
        : null,
    };
  }

  private async getBranchComparisonEntry(
    branch: Branch,
    startDate: Date,
    endDate: Date,
  ): Promise<BranchComparisonEntry> {
    const [salesAgg, expensesAgg, staffCount, topProducts] = await Promise.all([
      this.transactionRepo
        .createQueryBuilder('txn')
        .select('COALESCE(SUM(txn.total), 0)', 'total')
        .addSelect('COUNT(txn.id)', 'count')
        .where('txn.branch_id = :branchId', { branchId: branch.id })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .getRawOne<{ total: string; count: string }>(),
      this.expenseRepo
        .createQueryBuilder('exp')
        .select('COALESCE(SUM(exp.amount), 0)', 'total')
        .where('exp.branch_id = :branchId', { branchId: branch.id })
        .andWhere('exp.expense_date BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .getRawOne<{ total: string }>(),
      this.userRepo.count({ where: { branchId: branch.id } }),
      this.transactionItemRepo
        .createQueryBuilder('item')
        .innerJoin('item.transaction', 'txn')
        .innerJoin('item.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'productName')
        .addSelect('SUM(item.quantity)', 'quantity')
        .addSelect('SUM(item.line_total)', 'revenue')
        .where('txn.branch_id = :branchId', { branchId: branch.id })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('product.id')
        .addGroupBy('product.name')
        .orderBy('SUM(item.line_total)', 'DESC')
        .limit(5)
        .getRawMany<{
          productId: string;
          productName: string;
          quantity: string;
          revenue: string;
        }>(),
    ]);

    const revenue = Number(salesAgg?.total ?? 0);
    const expenses = Number(expensesAgg?.total ?? 0);
    const transactionCount = Number(salesAgg?.count ?? 0);

    return {
      branchId: branch.id,
      branchName: branch.name,
      revenue,
      expenses,
      expenseRatio: revenue > 0 ? expenses / revenue : 0,
      transactionCount,
      avgTransactionValue:
        transactionCount > 0 ? revenue / transactionCount : 0,
      staffCount,
      revenuePerStaff: staffCount > 0 ? revenue / staffCount : 0,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        quantity: Number(p.quantity ?? 0),
        revenue: Number(p.revenue ?? 0),
      })),
    };
  }

  private buildAlerts(performance: BranchPerformance[]): OverviewAlert[] {
    const alerts: OverviewAlert[] = [];

    for (const p of performance) {
      if (!p.isActive) {
        alerts.push({
          type: 'inactive_branch',
          branchId: p.branchId,
          branchName: p.branchName,
          message: `${p.branchName} is currently inactive`,
        });
        continue;
      }
      if (!p.adminName) {
        alerts.push({
          type: 'no_admin',
          branchId: p.branchId,
          branchName: p.branchName,
          message: `${p.branchName} has no admin assigned`,
        });
      }
      if (p.todayTransactions === 0) {
        alerts.push({
          type: 'no_transactions',
          branchId: p.branchId,
          branchName: p.branchName,
          message: `${p.branchName} has no transactions today`,
        });
      }
      if (p.lowStockItems > 0) {
        alerts.push({
          type: 'critical_low_stock',
          branchId: p.branchId,
          branchName: p.branchName,
          message: `${p.branchName} has ${p.lowStockItems} low-stock item${p.lowStockItems === 1 ? '' : 's'}`,
        });
      }
    }

    return alerts;
  }

  private getTodayRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
}
