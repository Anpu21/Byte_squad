import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminPortalService } from '@admin-portal/admin-portal.service';
import type {
  OverviewResponse,
  BranchWithMeta,
  AdminWithBranch,
  UserWithBranch,
  BranchComparisonResponse,
  InventoryMatrixResponse,
} from '@admin-portal/types';
import { BranchComparisonDto } from '@admin-portal/dto/branch-comparison.dto';
import { InventoryMatrixQueryDto } from '@admin-portal/dto/inventory-matrix-query.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { BranchActor } from '@common/scope/branch-scope';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.ADMIN_PORTAL.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPortalController {
  constructor(private readonly adminPortalService: AdminPortalService) {}

  @Get(APP_ROUTES.ADMIN_PORTAL.OVERVIEW)
  getOverview(): Promise<OverviewResponse> {
    return this.adminPortalService.getOverview();
  }

  @Get(APP_ROUTES.ADMIN_PORTAL.BRANCHES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listBranches(@CurrentUser() actor: BranchActor): Promise<BranchWithMeta[]> {
    return this.adminPortalService.listBranchesWithMeta(actor);
  }

  @Get(APP_ROUTES.ADMIN_PORTAL.ADMINS)
  listAdmins(): Promise<AdminWithBranch[]> {
    return this.adminPortalService.listAdmins();
  }

  @Get(APP_ROUTES.ADMIN_PORTAL.USERS)
  listAllUsers(): Promise<UserWithBranch[]> {
    return this.adminPortalService.listAllUsers();
  }

  @Post(APP_ROUTES.ADMIN_PORTAL.COMPARISON)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  compareBranches(
    @CurrentUser() actor: BranchActor,
    @Body() dto: BranchComparisonDto,
  ): Promise<BranchComparisonResponse> {
    return this.adminPortalService.getBranchComparison(
      actor,
      dto.branchIds,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Get(APP_ROUTES.ADMIN_PORTAL.INVENTORY_MATRIX)
  getInventoryMatrix(
    @Query() query: InventoryMatrixQueryDto,
  ): Promise<InventoryMatrixResponse> {
    return this.adminPortalService.getInventoryMatrix(query);
  }
}
