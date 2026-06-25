import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { LoyaltySettingsService } from '@/modules/loyalty-settings/loyalty-settings.service';
import { BranchAnalyticsRepository } from './branch-analytics.repository';
import type { BranchAnalyticsComparisonDto } from './dto/branch-analytics-comparison.dto';
import {
  BRANCH_ANALYTICS_SECTIONS,
  type BranchAnalyticsBranchOption,
  type BranchAnalyticsComparisonResponse,
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
    private readonly loyaltySettings: LoyaltySettingsService,
  ) {}

  async compareBranches(
    actor: BranchAnalyticsActor,
    dto: BranchAnalyticsComparisonDto,
  ): Promise<BranchAnalyticsComparisonResponse> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const requestedIds = dto.branchIds ?? [];
    const branchIds =
      actor.role === UserRole.MANAGER
        ? this.resolveManagerBranchIds(actor.branchId, requestedIds)
        : this.resolveAdminBranchIds(requestedIds);

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
