import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  SalesReportsService,
  type ReportsActor,
} from '@pos/sales-reports.service';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesReportsController {
  constructor(private readonly reports: SalesReportsService) {}

  @Get(APP_ROUTES.POS.REPORTS_SALESMAN)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  salesman(
    @CurrentUser() actor: ReportsActor,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reports.salesman({ startDate, endDate, branchId }, actor);
  }
}
