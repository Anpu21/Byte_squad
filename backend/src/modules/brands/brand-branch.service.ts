import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BrandRepository } from '@/modules/brands/brands.repository';
import {
  BrandBranchRepository,
  type BrandBranchParams,
} from '@/modules/brands/brand-branch.repository';
import {
  assembleBrandBranchProductRows,
  assembleBrandBranchRows,
} from '@/modules/brands/brand-branch.util';
import { percent } from '@/modules/brands/lib/percent.util';
import { parseDateRange } from '@/modules/brands/lib/parse-range.util';
import { zeroFillTrend } from '@/modules/brands/lib/zero-fill-trend.util';
import {
  resolvePagination,
  toPaginated,
} from '@common/pagination/paginate.util';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import type { Brand } from '@/modules/brands/entities/brand.entity';
import { BrandBranchComparisonDto } from '@/modules/brands/dto/brand-branch-comparison.dto';
import { BrandBranchProductsDto } from '@/modules/brands/dto/brand-branch-products.dto';
import { BrandBranchTrendDto } from '@/modules/brands/dto/brand-branch-trend.dto';
import type {
  BrandBranchComparisonResponse,
  BrandBranchOption,
  BrandBranchProductsResponse,
  BrandBranchSort,
  BrandBranchTrendResponse,
  BrandTrendPoint,
} from '@/modules/brands/types';

/**
 * Brand×branch comparison ("same brand, different branches"): which brands win
 * in which branch, one brand's products per branch, and one brand's daily
 * trend per branch.
 */
@Injectable()
export class BrandBranchService {
  constructor(
    private readonly brands: BrandRepository,
    private readonly branchData: BrandBranchRepository,
  ) {}

  /** All brands (incl. the Unbranded bucket) × the selected branches. */
  async getComparison(
    actor: AuthUser,
    dto: BrandBranchComparisonDto,
  ): Promise<BrandBranchComparisonResponse> {
    const { startDate, endDate } = parseDateRange(dto);
    const branches = await this.resolveBranches(actor, dto.branchIds);
    const params: BrandBranchParams = {
      branchIds: branches.map((b) => b.branchId),
      startDate,
      endDate,
    };

    const [roster, breakdown] = await Promise.all([
      this.branchData.brandRoster(params),
      this.branchData.brandBranchBreakdown(params),
    ]);
    const rows = assembleBrandBranchRows(roster, breakdown, params.branchIds);

    const totalRevenue = roster.reduce((s, r) => s + r.revenue, 0);
    const totalUnits = roster.reduce((s, r) => s + r.units, 0);
    const totalProfit = roster.reduce((s, r) => s + r.profit, 0);
    // Per-brand distinct-order counts, summed — a sale spanning two brands
    // counts twice. Same tallying as the brand overview, so the tabs agree.
    const totalTransactions = roster.reduce((s, r) => s + r.transactions, 0);

    return {
      branches,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalRevenue,
      totalUnits,
      totalProfit,
      totalTransactions,
      marginPct: percent(totalProfit, totalRevenue),
      rows: rows.map((r) => ({
        ...r,
        marginPct: percent(r.profit, r.revenue),
        sharePct: percent(r.revenue, totalRevenue),
      })),
    };
  }

  /** One brand's paginated product×branch matrix + selection-wide KPIs. */
  async getProducts(
    actor: AuthUser,
    dto: BrandBranchProductsDto,
  ): Promise<BrandBranchProductsResponse> {
    const { startDate, endDate } = parseDateRange(dto);
    const branches = await this.resolveBranches(actor, dto.branchIds);
    const brand = await this.requireBrand(dto.brandId);
    const params: BrandBranchParams = {
      branchIds: branches.map((b) => b.branchId),
      startDate,
      endDate,
    };

    const { page, limit, skip } = resolvePagination({
      page: dto.page,
      limit: dto.limit,
    });
    const sort: BrandBranchSort = dto.sort ?? 'revenue';
    const [summary, total, roster] = await Promise.all([
      this.branchData.brandSummary(params, brand.id),
      this.branchData.countBrandProducts(params, brand.id, dto.search),
      this.branchData.brandProductsRosterPage(params, brand.id, {
        search: dto.search,
        sort,
        limit,
        skip,
      }),
    ]);

    const productIds = roster.map((r) => r.productId);
    const breakdown =
      productIds.length > 0
        ? await this.branchData.productsBranchBreakdown(
            params,
            brand.id,
            productIds,
          )
        : [];

    const items = assembleBrandBranchProductRows(
      roster,
      breakdown,
      params.branchIds,
    ).map((r) => ({
      ...r,
      marginPct: percent(r.profit, r.revenue),
      sharePct: percent(r.revenue, summary.revenue),
    }));

    return {
      ...toPaginated(items, total, page, limit),
      brand: { id: brand.id, name: brand.name, color: brand.color },
      branches,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalRevenue: summary.revenue,
      totalUnits: summary.units,
      totalProfit: summary.profit,
      marginPct: percent(summary.profit, summary.revenue),
      sort,
    };
  }

  /** One brand's daily revenue/units — one zero-filled series per branch. */
  async getTrend(
    actor: AuthUser,
    dto: BrandBranchTrendDto,
  ): Promise<BrandBranchTrendResponse> {
    const { startDate, endDate } = parseDateRange(dto);
    const branches = await this.resolveBranches(actor, dto.branchIds);
    const brand = await this.requireBrand(dto.brandId);

    const raw = await this.branchData.brandTrendByBranch(
      { branchIds: branches.map((b) => b.branchId), startDate, endDate },
      brand.id,
    );
    const byBranch = new Map<string, BrandTrendPoint[]>();
    for (const row of raw) {
      const points = byBranch.get(row.branchId) ?? [];
      points.push({ date: row.date, revenue: row.revenue, units: row.units });
      byBranch.set(row.branchId, points);
    }

    return {
      brand: { id: brand.id, name: brand.name, color: brand.color },
      branches,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      series: branches.map((b) => ({
        branchId: b.branchId,
        points: zeroFillTrend(
          byBranch.get(b.branchId) ?? [],
          startDate,
          endDate,
        ),
      })),
    };
  }

  private async requireBrand(brandId: string): Promise<Brand> {
    const brand = await this.brands.findById(brandId);
    if (!brand) {
      throw new NotFoundException(`Brand "${brandId}" not found`);
    }
    return brand;
  }

  /**
   * Cross-branch RBAC — deliberately different from `resolveAnalyticsBranch`
   * (forced-own) used by the single-scope brand tabs: the comparison is
   * cross-branch by design, mirroring `BranchAnalyticsService.resolveBranchIds`
   * (managers already see product×branch numbers in Branch Compare). Admins
   * must pick ≥1 branch; a manager's own branch is always included and they may
   * add others.
   */
  private resolveComparisonBranchIds(
    actor: AuthUser,
    requested: readonly string[],
  ): string[] {
    if (actor.role === UserRole.MANAGER) {
      if (!actor.branchId) {
        throw new BadRequestException('Manager must be assigned to a branch');
      }
      return Array.from(new Set([actor.branchId, ...requested]));
    }
    if (requested.length === 0) {
      throw new BadRequestException('At least one branch is required');
    }
    return Array.from(new Set(requested));
  }

  private async resolveBranches(
    actor: AuthUser,
    requested?: string[],
  ): Promise<BrandBranchOption[]> {
    const branchIds = this.resolveComparisonBranchIds(actor, requested ?? []);
    const branches = await this.branchData.findBranchesByIds(branchIds);
    if (branches.length !== branchIds.length) {
      throw new BadRequestException('One or more branches were not found');
    }
    return branches;
  }
}
