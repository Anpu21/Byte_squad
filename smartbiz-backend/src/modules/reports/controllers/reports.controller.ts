import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Role } from '@common/constants/roles.enum';

@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('trial-balance')
    @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
    async getTrialBalance(
        @CurrentUser('companyId') companyId: string,
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
    ) {
        return this.reportsService.getTrialBalance(
            companyId,
            new Date(fromDate),
            new Date(toDate),
        );
    }

    @Get('profit-loss')
    @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
    async getProfitAndLoss(
        @CurrentUser('companyId') companyId: string,
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
    ) {
        return this.reportsService.getProfitAndLoss(
            companyId,
            new Date(fromDate),
            new Date(toDate),
        );
    }

    @Get('balance-sheet')
    @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
    async getBalanceSheet(
        @CurrentUser('companyId') companyId: string,
        @Query('asOfDate') asOfDate: string,
    ) {
        return this.reportsService.getBalanceSheet(companyId, new Date(asOfDate));
    }
}
