import { BadRequestException, Injectable } from '@nestjs/common';
import { Branch } from '@branches/entities/branch.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { BranchesService } from '@branches/branches.service';
import { UsersService } from '@users/users.service';
import { InventoryService } from '@inventory/inventory.service';
import { AdminPortalReportsRepository } from '@admin-portal/admin-portal-reports.repository';
import { InventoryMatrixQueryDto } from '@admin-portal/dto/inventory-matrix-query.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import {
  allowedBranchIds,
  assertBranchScope,
  type BranchActor,
} from '@common/scope/branch-scope';

// admin-portal owns no entity of its own — it composes cross-domain reporting.
// Simple read-by-id / count-by-branch operations go through the domain repos
// (BranchesRepository / UsersRepository / InventoryRepository); the bespoke
// admin aggregations (sales × products × expenses) live in the DataSource-
// injected AdminPortalReportsRepository, so no TypeORM leaks into this service.

import {
  BranchPerformance,
  OverviewSummary,
  OverviewAlert,
  OverviewResponse,
  BranchWithMeta,
  AdminWithBranch,
  UserWithBranch,
  TopProduct,
  BranchComparisonEntry,
  BranchComparisonResponse,
  InventoryMatrixBranchColumn,
  InventoryMatrixCell,
  InventoryMatrixRow,
  InventoryMatrixResponse,
} from '@admin-portal/types';

// Re-export so existing consumers that imported these from this file
// keep working without a broad rename. New code should import from
// '@admin-portal/types' directly.
export type {
  BranchPerformance,
  OverviewSummary,
  OverviewAlert,
  OverviewResponse,
  BranchWithMeta,
  AdminWithBranch,
  UserWithBranch,
  TopProduct,
  BranchComparisonEntry,
  BranchComparisonResponse,
  InventoryMatrixBranchColumn,
  InventoryMatrixCell,
  InventoryMatrixRow,
  InventoryMatrixResponse,
};

@Injectable()
export class AdminPortalService {
  constructor(
    private readonly branches: BranchesService,
    private readonly users: UsersService,
    private readonly inventory: InventoryService,
    private readonly reports: AdminPortalReportsRepository,
  ) {}

  async getOverview(): Promise<OverviewResponse> {
    const branches = await this.branches.findAllSortedByName();
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

  async listBranchesWithMeta(actor: BranchActor): Promise<BranchWithMeta[]> {
    const all = await this.branches.findAllSortedByName();
    // Non-admins see only their own branch (multi-tenant safety).
    const allowed = allowedBranchIds(actor);
    const branches = allowed ? all.filter((b) => allowed.includes(b.id)) : all;

    return Promise.all(
      branches.map(async (branch) => {
        const [manager, staffCount] = await Promise.all([
          this.users.findFirstByBranchAndRole(branch.id, UserRole.MANAGER),
          this.users.countByBranch(branch.id),
        ]);

        return {
          id: branch.id,
          code: branch.code,
          name: branch.name,
          addressLine1: branch.addressLine1,
          addressLine2: branch.addressLine2,
          city: branch.city,
          state: branch.state,
          country: branch.country,
          postalCode: branch.postalCode,
          phone: branch.phone,
          email: branch.email,
          isActive: branch.isActive,
          createdAt: branch.createdAt,
          updatedAt: branch.updatedAt,
          managerName: manager
            ? `${manager.firstName} ${manager.lastName}`
            : null,
          managerEmail: manager ? manager.email : null,
          staffCount,
        };
      }),
    );
  }

  async listAllUsers(): Promise<UserWithBranch[]> {
    const users = await this.users.findAllWithBranch();
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
    actor: BranchActor,
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
    // Non-admins may only compare their own branch (multi-tenant safety).
    for (const branchId of branchIds) {
      assertBranchScope(actor, branchId);
    }

    const branches = await this.branches.findByIds(branchIds);
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
    const admins = await this.users.findAllByRoleWithBranch(UserRole.ADMIN);

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

    const branches = await this.branches.findAllSortedByName();
    const branchColumns: InventoryMatrixBranchColumn[] = branches.map((b) => ({
      id: b.id,
      name: b.name,
      isActive: b.isActive,
    }));

    // When `lowStockOnly` is set we cannot reliably paginate at the SQL layer
    // because the flag depends on per-branch thresholds in the inventory rows.
    // The repo returns the full filtered list and we post-filter + paginate in JS.
    const { products, total } = await this.reports.findProductsForMatrix(
      {
        search: query.search,
        category: query.category,
        lowStockOnly: query.lowStockOnly,
      },
      offset,
      limit,
    );

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
    const inventoryRows = await this.inventory.findByProductIds(productIds);

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
        baseUnit: p.baseUnit,
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
    const [salesAgg, staffCount, activeProducts, lowStockItems, managerUser] =
      await Promise.all([
        this.reports.branchSalesAggregate(branch.id, todayStart, todayEnd),
        this.users.countByBranch(branch.id),
        this.inventory.countActiveForBranch(branch.id),
        this.inventory.countLowStockForBranch(branch.id),
        this.users.findFirstByBranchAndRole(branch.id, UserRole.MANAGER),
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
      managerName: managerUser
        ? `${managerUser.firstName} ${managerUser.lastName}`
        : null,
    };
  }

  private async getBranchComparisonEntry(
    branch: Branch,
    startDate: Date,
    endDate: Date,
  ): Promise<BranchComparisonEntry> {
    const [salesAgg, expensesAgg, staffCount, topProducts] = await Promise.all([
      this.reports.branchSalesAggregate(branch.id, startDate, endDate),
      this.reports.branchExpensesTotal(branch.id, startDate, endDate),
      this.users.countByBranch(branch.id),
      this.reports.branchTopProducts(branch.id, startDate, endDate),
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
      if (!p.managerName) {
        alerts.push({
          type: 'no_manager',
          branchId: p.branchId,
          branchName: p.branchName,
          message: `${p.branchName} has no manager assigned`,
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
