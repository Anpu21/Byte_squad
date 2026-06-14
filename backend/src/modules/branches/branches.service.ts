import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Branch } from '@branches/entities/branch.entity';
import { BranchesRepository } from '@branches/branches.repository';
import { BranchPerformanceRepository } from '@branches/branch-performance.repository';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import {
  allowedBranchIds,
  assertBranchScope,
  type BranchActor,
} from '@common/scope/branch-scope';

import {
  MyBranchInfo,
  MyBranchAdmin,
  MyBranchTodayKpis,
  MyBranchDailyPoint,
  MyBranchWeekKpis,
  MyBranchMonthKpis,
  MyBranchStaff,
  MyBranchInventory,
  MyBranchTopProduct,
  MyBranchLowStockItem,
  MyBranchRecentTransaction,
  MyBranchPerformance,
} from '@branches/types';

// Re-export so existing consumers that imported these from this file
// keep working without a broad rename. New code should import from
// '@branches/types' directly.
export type {
  MyBranchInfo,
  MyBranchAdmin,
  MyBranchTodayKpis,
  MyBranchDailyPoint,
  MyBranchWeekKpis,
  MyBranchMonthKpis,
  MyBranchStaff,
  MyBranchInventory,
  MyBranchTopProduct,
  MyBranchLowStockItem,
  MyBranchRecentTransaction,
  MyBranchPerformance,
};

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    private readonly branches: BranchesRepository,
    private readonly branchPerformance: BranchPerformanceRepository,
  ) {}

  // ── Read paths ─────────────────────────────────────────────────────────
  async findAll(actor: BranchActor): Promise<Branch[]> {
    const all = await this.branches.findAll();
    // Non-admins see only their own branch (multi-tenant safety).
    const allowed = allowedBranchIds(actor);
    return allowed ? all.filter((b) => allowed.includes(b.id)) : all;
  }

  async findById(actor: BranchActor, id: string): Promise<Branch | null> {
    assertBranchScope(actor, id);
    return this.branches.findById(id);
  }

  // ── Cross-module read pass-throughs ────────────────────────────────────
  // Other modules consume BranchesService, not BranchesRepository (blaxx
  // nestjs-07). Unscoped reads for internal cross-module composition.

  findEntityById(id: string): Promise<Branch | null> {
    return this.branches.findById(id);
  }

  findAllSortedByName(): Promise<Branch[]> {
    return this.branches.findAllSortedByName();
  }

  findByIds(ids: string[]): Promise<Branch[]> {
    return this.branches.findByIds(ids);
  }

  async toggleActive(id: string): Promise<Branch> {
    const branch = await this.branches.findById(id);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    branch.isActive = !branch.isActive;
    return this.branches.save(branch);
  }

  // ── Admin mutations (direct, no OTP) ───────────────────────────────────
  async create(adminUserId: string, dto: CreateBranchDto): Promise<Branch> {
    await this.assertCodeAvailable(dto.code, null);
    const branch = await this.branches.createAndSave({ ...dto });
    this.logger.log(
      `Branch ${branch.name} (${branch.code}) created by admin ${adminUserId}`,
    );
    return branch;
  }

  async update(
    adminUserId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<Branch | null> {
    const existing = await this.branches.findById(branchId);
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }
    if (dto.code !== undefined && dto.code !== existing.code) {
      await this.assertCodeAvailable(dto.code, branchId);
    }
    await this.branches.update(existing.id, dto);
    this.logger.log(`Branch ${existing.name} updated by admin ${adminUserId}`);
    return this.branches.findById(existing.id);
  }

  async delete(adminUserId: string, branchId: string): Promise<void> {
    const existing = await this.branches.findById(branchId);
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }
    await this.branches.delete(existing.id);
    this.logger.log(`Branch ${existing.name} deleted by admin ${adminUserId}`);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private async assertCodeAvailable(
    code: string,
    excludeBranchId: string | null,
  ): Promise<void> {
    const trimmed = code.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException('Branch code is required');
    }
    const existing = await this.branches.findByCode(trimmed);
    if (existing && existing.id !== excludeBranchId) {
      throw new ConflictException(`Branch code "${trimmed}" is already in use`);
    }
  }

  async getMyPerformance(branchId: string): Promise<MyBranchPerformance> {
    const branch = await this.branches.findById(branchId);
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

    const {
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
    } = await this.branchPerformance.getPerformanceData(branchId, {
      todayStart,
      todayEnd,
      weekStart,
      monthStart,
      monthEnd,
      monthStartDate,
      monthEndDate,
    });

    // Staff breakdown by role
    const staff: MyBranchStaff = {
      total: allStaff.length,
      byRole: {
        admin: allStaff.filter((u) => u.role === UserRole.ADMIN).length,
        manager: allStaff.filter((u) => u.role === UserRole.MANAGER).length,
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
        address: branch.addressLine1,
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
