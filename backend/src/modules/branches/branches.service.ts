import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import {
  PendingBranchAction,
  PendingBranchActionType,
} from '@branches/entities/pending-branch-action.entity';
import { BranchesRepository } from '@branches/branches.repository';
import { PendingBranchActionsRepository } from '@branches/pending-branch-actions.repository';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import {
  parseCreateBranchPayload,
  parseUpdateBranchPayload,
} from '@branches/branch-payload.parser';
// TODO Phase C6 / C8 / C4 / C5 — replace these cross-module borrowings with
// the corresponding *Repository classes once those modules migrate.
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';
import { EmailService } from '@/modules/email/email.service';

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

const OTP_EXPIRES_IN_MINUTES = 10;

export interface BranchActionRequestResult {
  actionId: string;
  expiresAt: Date;
  action: PendingBranchActionType;
}

export interface BranchActionConfirmResult {
  action: PendingBranchActionType;
  branch: Branch | null;
}

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    private readonly branches: BranchesRepository,
    private readonly pendingActions: PendingBranchActionsRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
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

  // ── Read paths (unchanged) ─────────────────────────────────────────────
  async findAll(): Promise<Branch[]> {
    return this.branches.findAll();
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branches.findById(id);
  }

  async toggleActive(id: string): Promise<Branch> {
    const branch = await this.branches.findById(id);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    branch.isActive = !branch.isActive;
    return this.branches.save(branch);
  }

  // ── Two-step mutations: request* stages the action and emails OTP. ──────
  async requestCreate(
    adminUserId: string,
    dto: CreateBranchDto,
  ): Promise<BranchActionRequestResult> {
    await this.assertCodeAvailable(dto.code, null);
    return this.stageAction(adminUserId, {
      actionType: 'create',
      branchId: null,
      payload: { ...dto },
      branchLabel: dto.name,
    });
  }

  async requestUpdate(
    adminUserId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<BranchActionRequestResult> {
    const branch = await this.branches.findById(branchId);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    if (dto.code !== undefined) {
      await this.assertCodeAvailable(dto.code, branchId);
    }
    return this.stageAction(adminUserId, {
      actionType: 'update',
      branchId,
      payload: { ...dto },
      branchLabel: branch.name,
    });
  }

  async requestDelete(
    adminUserId: string,
    branchId: string,
  ): Promise<BranchActionRequestResult> {
    const branch = await this.branches.findById(branchId);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return this.stageAction(adminUserId, {
      actionType: 'delete',
      branchId,
      payload: null,
      branchLabel: branch.name,
    });
  }

  async resendActionOtp(
    adminUserId: string,
    actionId: string,
  ): Promise<{ expiresAt: Date }> {
    const pending = await this.loadOwnedPendingAction(adminUserId, actionId);
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
    await this.pendingActions.refreshOtp(pending.id, otpCode, expiresAt);

    const admin = await this.userRepository.findOne({
      where: { id: adminUserId },
    });
    if (!admin) {
      throw new NotFoundException('Admin account not found');
    }
    await this.sendOtp(
      admin,
      otpCode,
      pending.actionType,
      this.payloadLabel(pending) ?? 'a branch',
    );
    return { expiresAt };
  }

  async confirmAction(
    adminUserId: string,
    actionId: string,
    otpCode: string,
  ): Promise<BranchActionConfirmResult> {
    const pending = await this.loadOwnedPendingAction(adminUserId, actionId);

    if (pending.consumedAt) {
      throw new BadRequestException('This confirmation has already been used');
    }
    if (new Date() > pending.expiresAt) {
      throw new BadRequestException('Confirmation code has expired');
    }
    if (pending.otpCode !== otpCode) {
      throw new BadRequestException('Invalid confirmation code');
    }

    let branch: Branch | null = null;
    switch (pending.actionType) {
      case 'create': {
        const payload = parseCreateBranchPayload(pending.payload);
        await this.assertCodeAvailable(payload.code, null);
        branch = await this.branches.createAndSave({ ...payload });
        break;
      }
      case 'update': {
        if (!pending.branchId) {
          throw new ConflictException(
            'Pending update is missing its branch reference',
          );
        }
        const existing = await this.branches.findById(pending.branchId);
        if (!existing) {
          throw new NotFoundException('Branch no longer exists');
        }
        const payload = parseUpdateBranchPayload(pending.payload);
        if (payload.code !== undefined && payload.code !== existing.code) {
          await this.assertCodeAvailable(payload.code, existing.id);
        }
        await this.branches.update(existing.id, payload);
        branch = await this.branches.findById(existing.id);
        break;
      }
      case 'delete': {
        if (!pending.branchId) {
          throw new ConflictException(
            'Pending delete is missing its branch reference',
          );
        }
        const existing = await this.branches.findById(pending.branchId);
        if (!existing) {
          throw new NotFoundException('Branch no longer exists');
        }
        await this.branches.delete(existing.id);
        branch = null;
        break;
      }
      default: {
        throw new ConflictException('Unknown pending action');
      }
    }

    await this.pendingActions.markConsumed(pending.id, new Date());
    return { action: pending.actionType, branch };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private async stageAction(
    adminUserId: string,
    args: {
      actionType: PendingBranchActionType;
      branchId: string | null;
      payload: Record<string, unknown> | null;
      branchLabel: string;
    },
  ): Promise<BranchActionRequestResult> {
    const admin = await this.userRepository.findOne({
      where: { id: adminUserId },
    });
    if (!admin) {
      throw new NotFoundException('Admin account not found');
    }

    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    const pending = await this.pendingActions.create({
      userId: adminUserId,
      actionType: args.actionType,
      branchId: args.branchId,
      payload: args.payload,
      otpCode,
      expiresAt,
    });

    try {
      await this.sendOtp(admin, otpCode, args.actionType, args.branchLabel);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send branch-action OTP to ${admin.email}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'Email service unavailable. Please try again in a moment.',
      );
    }

    return {
      actionId: pending.id,
      expiresAt,
      action: args.actionType,
    };
  }

  private async sendOtp(
    admin: User,
    otpCode: string,
    action: PendingBranchActionType,
    branchLabel: string,
  ): Promise<void> {
    if (this.emailService.isVerified()) {
      await this.emailService.sendBranchActionOtpEmail(
        admin.email,
        admin.firstName,
        otpCode,
        action,
        branchLabel,
        OTP_EXPIRES_IN_MINUTES,
      );
      return;
    }
    if (this.isProduction()) {
      throw new ServiceUnavailableException(
        'Email service unavailable. Please try again in a moment.',
      );
    }
    // Dev fallback — log so the developer can copy the code from container logs.
    this.logger.warn(
      `✨ DEV branch-action OTP for ${admin.email} (${action} ${branchLabel}): ${otpCode} (expires in ${OTP_EXPIRES_IN_MINUTES}m).`,
    );
  }

  private async loadOwnedPendingAction(
    adminUserId: string,
    actionId: string,
  ): Promise<PendingBranchAction> {
    const pending = await this.pendingActions.findById(actionId);
    if (!pending) {
      throw new NotFoundException('Pending action not found');
    }
    if (pending.userId !== adminUserId) {
      throw new ForbiddenException(
        'You can only confirm your own branch actions',
      );
    }
    return pending;
  }

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

  private payloadLabel(action: PendingBranchAction): string | null {
    if (action.payload && typeof action.payload === 'object') {
      const name = action.payload.name;
      if (typeof name === 'string') return name;
    }
    return null;
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private isProduction(): boolean {
    return (
      (this.configService.get<string>('NODE_ENV') ?? 'development') ===
      'production'
    );
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
