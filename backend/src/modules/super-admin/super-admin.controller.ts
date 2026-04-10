import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  SuperAdminService,
  OverviewResponse,
  BranchWithMeta,
  AdminWithBranch,
} from '@super-admin/super-admin.service';
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
}
