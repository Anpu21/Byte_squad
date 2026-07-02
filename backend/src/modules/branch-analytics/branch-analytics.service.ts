import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { BranchAnalyticsRepository } from './branch-analytics.repository';
import { BranchAnalyticsProductsRepository } from './branch-analytics-products.repository';
import type { BranchAnalyticsComparisonDto } from './dto/branch-analytics-comparison.dto';
import type { BranchAnalyticsProductsDto } from './dto/branch-analytics-products.dto';
import {
  BRANCH_ANALYTICS_SECTIONS,
  type BranchAnalyticsBranchOption,
  type BranchAnalyticsComparisonResponse,
  type BranchAnalyticsProductsResponse,
} from './types';

interface BranchAnalyticsActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class BranchAnalyticsService {
  constructor(
    private readonly analytics: BranchAnalyticsRepository,
    private readonly products: BranchAnalyticsProductsRepository,
    private readonly loyaltySettings: LoyaltySettingsService,
  ) {}

  async compareBranches(
    actor: BranchAnalyticsActor,
    dto: BranchAnalyticsComparisonDto,
  ): Promise<BranchAnalyticsComparisonResponse> {
    const { startDate, endDate } = this.parseDateRange(dto);
    const branchIds = this.resolveBranchIds(actor, dto.branchIds ?? []);

    const branches = await this.analytics.findBranchesByIds(branchIds);
    if (branches.length !== branchIds.length) {
      throw new BadRequestException('One or more branches were not found');
    }

    const settings = await this.loyaltySettings.get();
    const pointValue = settings.pointValue > 0 ? settings.pointValue : 1;

    return this.analytics.getComparison({
      branches,
      startDate,
      endDate,
      sections: new Set(dto.sections ?? BRANCH_ANALYTICS_SECTIONS),
      settings: {
        pointValue,
        silverTierPoints: settings.silverTierPoints,
        goldTierPoints: settings.goldTierPoints,
      },
      ownBranchId: actor.role === UserRole.MANAGER ? actor.branchId : null,
    });
  }

  /**
   * Accurate per-product cross-branch comparison (Products tab). Same RBAC +
   * branch resolution + date parsing as `compareBranches`, delegating to the
   * dedicated products repository which returns a paginated, searchable
   * product×branch matrix (every selected branch present, zero-filled).
   */
  async compareProducts(
    actor: BranchAnalyticsActor,
    dto: BranchAnalyticsProductsDto,
  ): Promise<BranchAnalyticsProductsResponse> {
    const { startDate, endDate } = this.parseDateRange(dto);
    const branchIds = this.resolveBranchIds(actor, dto.branchIds ?? []);

    const branches = await this.analytics.findBranchesByIds(branchIds);
    if (branches.length !== branchIds.length) {
      throw new BadRequestException('One or more branches were not found');
    }

    return this.products.getProductComparison({
      branches: branches.map((branch) => ({
        branchId: branch.id,
        branchName: branch.name,
      })),
      startDate,
      endDate,
      search: dto.search,
      sort: dto.sort ?? 'revenue',
      page: dto.page,
      limit: dto.limit,
    });
  }

  /**
   * Branch roster for the comparison picker. Returns every branch (id + name +
   * active flag) for admins AND managers, so a manager can pick which other
   * branches to compare their own against. Intentionally NOT branch-scoped —
   * the comparison feature is cross-branch by design.
   */
  async listBranches(): Promise<BranchAnalyticsBranchOption[]> {
    const branches = await this.analytics.listBranches();
    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      isActive: branch.isActive,
    }));
  }

  private parseDateRange(dto: { startDate: string; endDate: string }): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }
    return { startDate, endDate };
  }

  private resolveBranchIds(
    actor: BranchAnalyticsActor,
    requestedIds: readonly string[],
  ): string[] {
    return actor.role === UserRole.MANAGER
      ? this.resolveManagerBranchIds(actor.branchId, requestedIds)
      : this.resolveAdminBranchIds(requestedIds);
  }

  private resolveAdminBranchIds(branchIds: readonly string[]): string[] {
    if (branchIds.length === 0) {
      throw new BadRequestException('At least one branch is required');
    }
    return this.unique(branchIds);
  }

  private resolveManagerBranchIds(
    actorBranchId: string | null,
    branchIds: readonly string[],
  ): string[] {
    if (!actorBranchId) {
      throw new BadRequestException('Manager must be assigned to a branch');
    }
    return this.unique([actorBranchId, ...branchIds]);
  }

  private unique(branchIds: readonly string[]): string[] {
    return Array.from(new Set(branchIds));
  }
}
