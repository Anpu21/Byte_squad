import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '@super-admin/super-admin.service';
import type {
  OverviewResponse,
  BranchWithMeta,
  AdminWithBranch,
  UserWithBranch,
  BranchComparisonResponse,
} from '@super-admin/super-admin.service';
import { BranchComparisonDto } from '@super-admin/dto/branch-comparison.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.SUPER_ADMIN.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get(APP_ROUTES.SUPER_ADMIN.OVERVIEW)
  getOverview(): Promise<OverviewResponse> {
    return this.superAdminService.getOverview();
  }

  @Get(APP_ROUTES.SUPER_ADMIN.BRANCHES)
  listBranches(): Promise<BranchWithMeta[]> {
    return this.superAdminService.listBranchesWithMeta();
  }

  @Get(APP_ROUTES.SUPER_ADMIN.ADMINS)
  listAdmins(): Promise<AdminWithBranch[]> {
    return this.superAdminService.listAdmins();
  }

  @Get(APP_ROUTES.SUPER_ADMIN.USERS)
  listAllUsers(): Promise<UserWithBranch[]> {
    return this.superAdminService.listAllUsers();
  }

  @Post(APP_ROUTES.SUPER_ADMIN.COMPARISON)
  compareBranches(
    @Body() dto: BranchComparisonDto,
  ): Promise<BranchComparisonResponse> {
    return this.superAdminService.getBranchComparison(
      dto.branchIds,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }
}
