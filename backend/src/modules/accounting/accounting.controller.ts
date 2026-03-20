import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-roles.enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { APP_ROUTES } from '@/common/routes/app.routes';
import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AccountingService } from '@accounting/accounting.service';
import { CreateExpenseDto } from '@accounting/dto/create-expense.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Expense } from '@accounting/entities/expense.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';

@Controller(APP_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get(APP_ROUTES.ACCOUNTING.LEDGER)
  getLedger(@CurrentUser('branchId') branchId: string): Promise<LedgerEntry[]> {
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
  getExpenses(@CurrentUser('branchId') branchId: string): Promise<Expense[]> {
    return this.accountingService.getExpenses(branchId);
  }

  @Delete(APP_ROUTES.ACCOUNTING.EXPENSE_BY_ID)
  deleteExpense(@Param('id') id: string): Promise<void> {
    return this.accountingService.deleteExpense(id);
  }

  @Get(APP_ROUTES.ACCOUNTING.PROFIT_LOSS)
  getProfitLoss(
    @CurrentUser('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Default to current month
    const now = new Date();
    const start =
      startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    return this.accountingService.getProfitLoss(branchId, start, end);
  }
}
