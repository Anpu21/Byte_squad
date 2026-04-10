import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
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

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
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

  // ── Internals ───────────────────────────────────────────

  private async getBranchPerformance(
    branch: Branch,
    todayStart: Date,
    todayEnd: Date,
  ): Promise<BranchPerformance> {
    const [
      salesAgg,
      staffCount,
      activeProducts,
      lowStockItems,
      adminUser,
    ] = await Promise.all([
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
