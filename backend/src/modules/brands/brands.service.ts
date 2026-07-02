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
import { percent } from '@/modules/brands/lib/percent.util';
import { parseDateRange } from '@/modules/brands/lib/parse-range.util';
import { zeroFillTrend } from '@/modules/brands/lib/zero-fill-trend.util';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import type {
  BrandOverviewResponse,
  BrandDrilldownResponse,
  CategoryBrandComparisonResponse,
  CategoryProductsResponse,
  CategoryProductSort,
} from '@/modules/brands/types';

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
    const { startDate, endDate } = parseDateRange(query);
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
    const { startDate, endDate } = parseDateRange(query);
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
    const { startDate, endDate } = parseDateRange(query);
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
    const { startDate, endDate } = parseDateRange(dto);
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
