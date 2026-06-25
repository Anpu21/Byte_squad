import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { FinancialReportsService } from '@/modules/accounting-reports/financial-reports.service';
import type {
  BalanceSheetReport,
  DayBookReport,
  TrialBalanceReport,
} from '@/modules/accounting-reports/types/financial-report-row.type';

@Controller(APP_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialReportsController {
  constructor(private readonly reports: FinancialReportsService) {}

  @Get(APP_ROUTES.ACCOUNTING.TRIAL_BALANCE)
  @Roles(UserRole.ADMIN)
  trialBalance(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TrialBalanceReport> {
    return this.reports.trialBalance(branchId ?? null, startDate, endDate);
  }

  @Get(APP_ROUTES.ACCOUNTING.BALANCE_SHEET)
  @Roles(UserRole.ADMIN)
  balanceSheet(
    @Query('branchId') branchId?: string,
    @Query('asOf') asOf?: string,
  ): Promise<BalanceSheetReport> {
    return this.reports.balanceSheet(branchId ?? null, asOf);
  }

  @Get(APP_ROUTES.ACCOUNTING.DAY_BOOK)
  @Roles(UserRole.ADMIN)
  dayBook(
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ): Promise<DayBookReport> {
    return this.reports.dayBook(branchId ?? null, date);
  }
}
