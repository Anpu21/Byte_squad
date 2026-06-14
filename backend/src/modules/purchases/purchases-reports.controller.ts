import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { PayablesReportsService } from '@/modules/purchases/payables-reports.service';
import type {
  PayablesAgeingRow,
  PayablesOutstandingRow,
} from '@/modules/purchases/types/payables-report-row.type';

@Controller(APP_ROUTES.PURCHASES.REPORTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasesReportsController {
  constructor(private readonly reports: PayablesReportsService) {}

  @Get(APP_ROUTES.PURCHASES.REPORTS.OUTSTANDING)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  outstanding(): Promise<PayablesOutstandingRow[]> {
    return this.reports.outstanding();
  }

  @Get(APP_ROUTES.PURCHASES.REPORTS.AGEING)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  ageing(): Promise<PayablesAgeingRow[]> {
    return this.reports.ageing();
  }
}
