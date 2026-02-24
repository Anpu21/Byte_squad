import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../../../shared/constants/enums.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';
import { LedgerEntry } from './entities/ledger-entry.entity.js';
import { Expense } from './entities/expense.entity.js';

@Controller(BACKEND_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Get(BACKEND_ROUTES.ACCOUNTING.LEDGER)
    getLedger(
        @CurrentUser('branchId') branchId: string,
    ): Promise<LedgerEntry[]> {
        return this.accountingService.getLedgerEntries(branchId);
    }

    @Post(BACKEND_ROUTES.ACCOUNTING.EXPENSES)
    createExpense(
        @Body() createExpenseDto: CreateExpenseDto,
        @CurrentUser('id') userId: string,
    ): Promise<Expense> {
        return this.accountingService.createExpense(createExpenseDto, userId);
    }

    @Get(BACKEND_ROUTES.ACCOUNTING.EXPENSES)
    getExpenses(
        @CurrentUser('branchId') branchId: string,
    ): Promise<Expense[]> {
        return this.accountingService.getExpenses(branchId);
    }
}
