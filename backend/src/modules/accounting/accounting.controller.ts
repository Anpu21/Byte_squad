import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-roles.enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { APP_ROUTES } from '@/common/routes/app.routes';
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AccountingService } from '@accounting/accounting.service';
import { CreateExpenseDto } from '@accounting/dto/create-expense.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Expense } from '@accounting/entities/expense.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';


@Controller(APP_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Get(APP_ROUTES.ACCOUNTING.LEDGER)
    getLedger(
        @CurrentUser('branchId') branchId: string,
    ): Promise<LedgerEntry[]> {
        return this.accountingService.getLedgerEntries(branchId);
    }

    @Post(APP_ROUTES.ACCOUNTING.EXPENSES)
    createExpense(
        @Body() createExpenseDto: CreateExpenseDto,
        @CurrentUser('id') userId: string,
    ): Promise<Expense> {
        return this.accountingService.createExpense(createExpenseDto, userId);
    }

    @Get(APP_ROUTES.ACCOUNTING.EXPENSES)
    getExpenses(
        @CurrentUser('branchId') branchId: string,
    ): Promise<Expense[]> {
        return this.accountingService.getExpenses(branchId);
    }
}
