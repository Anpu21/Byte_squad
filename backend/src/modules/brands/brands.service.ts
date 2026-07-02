import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from '@/modules/brands/entities/brand.entity';
import {
  BrandRepository,
  type BrandWithCount,
} from '@/modules/brands/brands.repository';
import { CreateBrandDto } from '@/modules/brands/dto/create-brand.dto';
import { UpdateBrandDto } from '@/modules/brands/dto/update-brand.dto';
import { BrandAnalyticsQueryDto } from '@/modules/brands/dto/brand-analytics-query.dto';
import { CategoryProductsQueryDto } from '@/modules/brands/dto/category-products-query.dto';
import { CategoryRepository } from '@/modules/categories/category.repository';
import {
  resolvePagination,
  toPaginated,
} from '@common/pagination/paginate.util';
import { pickBrandColor } from '@/modules/brands/lib/brand-palette';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import type {
  BrandOverviewResponse,
  BrandDrilldownResponse,
  BrandTrendPoint,
  CategoryBrandComparisonResponse,
  CategoryProductsResponse,
  CategoryProductSort,
} from '@/modules/brands/types';

/** One-decimal percentage of part/whole (0 when whole is 0). */
function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

/**
 * Fill missing days in [start, end] with zero points so the trend line is
 * continuous. Days are keyed by UTC YYYY-MM-DD to match the repository's
 * TO_CHAR(created_at) buckets (timestamps are stored in UTC).
 */
function zeroFillTrend(
  rows: BrandTrendPoint[],
  start: Date,
  end: Date,
): BrandTrendPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: BrandTrendPoint[] = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  while (cursor.getTime() <= last) {
    const key = cursor.toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? { date: key, revenue: 0, units: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

@Injectable()
export class BrandsService {
  constructor(
    private readonly brands: BrandRepository,
    private readonly categories: CategoryRepository,
  ) {}

  list(includeInactive = false): Promise<BrandWithCount[]> {
    return this.brands.list(includeInactive);
  }

  /** One brand with its product count (manage UI + delete-guard preview). */
  async getById(id: string): Promise<BrandWithCount> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found`);
    }
    const productCount = await this.brands.countProductsForBrand(id);
    return { ...brand, productCount };
  }

  async create(dto: CreateBrandDto, actor: AuthUser): Promise<Brand> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Brand name is required');
    }
    const existing = await this.brands.findByName(name);
    if (existing) {
      throw new ConflictException(`Brand "${name}" already exists`);
    }
    const count = await this.brands.count();
    return this.brands.save(
      this.brands.create({
        name,
        description: dto.description?.trim() || null,
        color: dto.color?.trim() || pickBrandColor(count),
        sortOrder: dto.sortOrder ?? count,
        createdByUserId: actor.id,
      }),
    );
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found`);
    }

    let renamed = false;
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Brand name is required');
      }
      if (name !== brand.name) {
        const clash = await this.brands.findByName(name);
        if (clash && clash.id !== id) {
          throw new ConflictException(`Brand "${name}" already exists`);
        }
        brand.name = name;
        renamed = true;
      }
    }
    if (dto.description !== undefined) {
      brand.description = dto.description?.trim() || null;
    }
    if (dto.color !== undefined) {
      brand.color = dto.color?.trim() || null;
    }
    if (dto.sortOrder !== undefined) {
      brand.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      brand.isActive = dto.isActive;
    }

    const saved = await this.brands.save(brand);
    if (renamed) {
      // Keep the denormalized product.brand mirror correct after a rename.
      await this.brands.syncProductBrandName(id, saved.name);
    }
    return saved;
  }

  /** Soft-archive (isActive=false). Admin only — products keep their FK. */
  async archive(id: string): Promise<Brand> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found`);
    }
    brand.isActive = false;
    return this.brands.save(brand);
  }

  /**
   * Hard-delete a brand. Guarded: a brand still referenced by products cannot be
   * removed (the product→brand FK is ON DELETE RESTRICT) — archive it instead.
   */
  async remove(id: string): Promise<void> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found`);
    }
    const productCount = await this.brands.countProductsForBrand(id);
    if (productCount > 0) {
      throw new ConflictException(
        `Brand "${brand.name}" is used by ${productCount} product(s); archive it instead`,
      );
    }
    await this.brands.delete(id);
  }

  // ── Analytics ──────────────────────────────────────────

  /** Brand leaderboard: every brand ranked by revenue, with margin + share. */
  async getOverview(
    actor: AuthUser,
    query: BrandAnalyticsQueryDto,
  ): Promise<BrandOverviewResponse> {
    const { startDate, endDate } = this.parseRange(query);
    const branchId = this.resolveAnalyticsBranch(actor, query.branchId);
    const rows = await this.brands.leaderboard({
      branchId,
      startDate,
      endDate,
    });

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalUnits = rows.reduce((s, r) => s + r.units, 0);
    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
    const totalTransactions = rows.reduce((s, r) => s + r.transactions, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branchId,
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

  /** One brand's drill-down: KPIs, per-product breakdown, daily revenue trend. */
  async getBrandAnalytics(
    actor: AuthUser,
    brandId: string,
    query: BrandAnalyticsQueryDto,
  ): Promise<BrandDrilldownResponse> {
    const { startDate, endDate } = this.parseRange(query);
    const branchId = this.resolveAnalyticsBranch(actor, query.branchId);
    const brand = await this.brands.findById(brandId);
    if (!brand) {
      throw new NotFoundException(`Brand "${brandId}" not found`);
    }

    const params = { branchId, startDate, endDate };
    const [summary, categories, products, trendRows] = await Promise.all([
      this.brands.brandSummary(params, brandId),
      this.brands.categoriesForBrand(params, brandId),
      this.brands.productsForBrand(params, brandId, query.categoryId),
      this.brands.brandTrend(params, brandId),
    ]);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branchId,
      brand: { id: brand.id, name: brand.name, color: brand.color },
      totalRevenue: summary.revenue,
      totalUnits: summary.units,
      totalProfit: summary.profit,
      totalTransactions: summary.transactions,
      marginPct: percent(summary.profit, summary.revenue),
      categories: categories.map((c) => ({
        ...c,
        marginPct: percent(c.profit, c.revenue),
        sharePct: percent(c.revenue, summary.revenue),
      })),
      products: products.map((p) => ({
        ...p,
        marginPct: percent(p.profit, p.revenue),
        sharePct: percent(p.revenue, summary.revenue),
      })),
      trend: zeroFillTrend(trendRows, startDate, endDate),
    };
  }

  /**
   * "Same category, different brands": every brand's sales within one category,
   * with share of the category total. Includes an Unbranded bucket.
   */
  async getCategoryComparison(
    actor: AuthUser,
    categoryId: string,
    query: BrandAnalyticsQueryDto,
  ): Promise<CategoryBrandComparisonResponse> {
    const { startDate, endDate } = this.parseRange(query);
    const branchId = this.resolveAnalyticsBranch(actor, query.branchId);
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category "${categoryId}" not found`);
    }

    const params = { branchId, startDate, endDate };
    const [summary, brands] = await Promise.all([
      this.brands.categorySummary(params, categoryId),
      this.brands.brandsForCategory(params, categoryId),
    ]);

    return {
      categoryId,
      categoryName: category.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branchId,
      totalRevenue: summary.revenue,
      totalUnits: summary.units,
      totalProfit: summary.profit,
      totalTransactions: summary.transactions,
      marginPct: percent(summary.profit, summary.revenue),
      brands: brands.map((b) => ({
        ...b,
        marginPct: percent(b.profit, b.revenue),
        sharePct: percent(b.revenue, summary.revenue),
      })),
    };
  }

  /** Paginated, brand-tagged product roster within one category. */
  async getCategoryProducts(
    actor: AuthUser,
    categoryId: string,
    dto: CategoryProductsQueryDto,
  ): Promise<CategoryProductsResponse> {
    const { startDate, endDate } = this.parseRange(dto);
    const branchId = this.resolveAnalyticsBranch(actor, dto.branchId);
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category "${categoryId}" not found`);
    }

    const { page, limit, skip } = resolvePagination({
      page: dto.page,
      limit: dto.limit,
    });
    const sort: CategoryProductSort = dto.sort ?? 'revenue';
    const params = { branchId, startDate, endDate };
    const [summary, total, rows] = await Promise.all([
      this.brands.categorySummary(params, categoryId),
      this.brands.countCategoryProducts(
        params,
        categoryId,
        dto.brandId,
        dto.search,
      ),
      this.brands.categoryProductsPage(params, categoryId, {
        brandId: dto.brandId,
        search: dto.search,
        sort,
        limit,
        skip,
      }),
    ]);

    const items = rows.map((r) => ({
      ...r,
      marginPct: percent(r.profit, r.revenue),
      sharePct: percent(r.revenue, summary.revenue),
    }));

    return {
      ...toPaginated(items, total, page, limit),
      categoryId,
      categoryName: category.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branchId,
      sort,
    };
  }

  private parseRange(query: { startDate: string; endDate: string }): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }
    return { startDate, endDate };
  }

  /**
   * Admin → optional branch filter (null = all branches). Manager → forced to
   * their own branch; requesting another branch is rejected.
   */
  private resolveAnalyticsBranch(
    actor: AuthUser,
    requested?: string,
  ): string | null {
    if (actor.role === UserRole.ADMIN) {
      return requested ?? null;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return actor.branchId;
  }
}
