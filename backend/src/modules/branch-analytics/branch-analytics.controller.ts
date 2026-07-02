import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import type { AuthUser } from '@common/types/auth-user.type';
import { BranchAnalyticsComparisonDto } from './dto/branch-analytics-comparison.dto';
import { BranchAnalyticsProductsDto } from './dto/branch-analytics-products.dto';
import { BranchAnalyticsService } from './branch-analytics.service';

@Controller(APP_ROUTES.BRANCH_ANALYTICS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class BranchAnalyticsController {
  constructor(private readonly branchAnalytics: BranchAnalyticsService) {}

  @Post(APP_ROUTES.BRANCH_ANALYTICS.COMPARISON)
  compareBranches(
    @CurrentUser() user: AuthUser,
    @Body() dto: BranchAnalyticsComparisonDto,
  ) {
    return this.branchAnalytics.compareBranches(user, dto);
  }

  @Post(APP_ROUTES.BRANCH_ANALYTICS.PRODUCTS)
  compareProducts(
    @CurrentUser() user: AuthUser,
    @Body() dto: BranchAnalyticsProductsDto,
  ) {
    return this.branchAnalytics.compareProducts(user, dto);
  }

  @Get(APP_ROUTES.BRANCH_ANALYTICS.BRANCHES)
  listBranches() {
    return this.branchAnalytics.listBranches();
  }
}
