import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '@/modules/categories/entities/category.entity';
import { CategoryRepository } from '@/modules/categories/category.repository';
import { CreateCategoryDto } from '@/modules/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/modules/categories/dto/update-category.dto';
import { CategoryAnalyticsQueryDto } from '@/modules/categories/dto/category-analytics-query.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import type { CategoryAnalyticsResponse } from '@/modules/categories/types';

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoryRepository) {}

  list(includeInactive = false): Promise<Category[]> {
    return this.categories.list(includeInactive);
  }

  async create(dto: CreateCategoryDto, actor: AuthUser): Promise<Category> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Category name is required');
    }
    const existing = await this.categories.findByName(name);
    if (existing) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
    return this.categories.save(
      this.categories.create({
        name,
        description: dto.description?.trim() || null,
        color: dto.color?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        createdByUserId: actor.id,
      }),
    );
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundException(`Category "${id}" not found`);
    }

    let renamed = false;
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Category name is required');
      }
      if (name !== category.name) {
        const clash = await this.categories.findByName(name);
        if (clash && clash.id !== id) {
          throw new ConflictException(`Category "${name}" already exists`);
        }
        category.name = name;
        renamed = true;
      }
    }
    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || null;
    }
    if (dto.color !== undefined) {
      category.color = dto.color?.trim() || null;
    }
    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    const saved = await this.categories.save(category);
    if (renamed) {
      // Keep the denormalized product.category mirror correct after a rename.
      await this.categories.syncProductCategoryName(id, saved.name);
    }
    return saved;
  }

  /** Soft-archive (isActive=false). Admin only — products keep their FK. */
  async archive(id: string): Promise<Category> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundException(`Category "${id}" not found`);
    }
    category.isActive = false;
    return this.categories.save(category);
  }

  async getAnalytics(
    actor: AuthUser,
    query: CategoryAnalyticsQueryDto,
  ): Promise<CategoryAnalyticsResponse> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const branchId = this.resolveAnalyticsBranch(actor, query.branchId);
    const rows = await this.categories.salesByCategory({
      branchId,
      startDate,
      endDate,
    });

    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
    const totalTransactions = rows.reduce((sum, r) => sum + r.transactions, 0);
    const withShare = rows.map((r) => ({
      ...r,
      sharePct:
        totalRevenue > 0
          ? Math.round((r.revenue / totalRevenue) * 1000) / 10
          : 0,
    }));

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branchId,
      totalRevenue,
      totalUnits,
      totalTransactions,
      rows: withShare,
    };
  }

  /**
   * Admin → optional branch filter (null = all branches). Manager/Cashier →
   * forced to their own branch; requesting another branch is rejected.
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
