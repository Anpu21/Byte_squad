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
import { UserRole } from '@common/enums/user-roles.enums';
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
  listBranches(): Promise<BranchWithMeta[]> {
    return this.adminPortalService.listBranchesWithMeta();
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
  compareBranches(
    @Body() dto: BranchComparisonDto,
  ): Promise<BranchComparisonResponse> {
    return this.adminPortalService.getBranchComparison(
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
