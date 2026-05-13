import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-roles.enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { APP_ROUTES } from '@/common/routes/app.routes';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AccountingService } from '@accounting/accounting.service';
import { CreateExpenseDto } from '@accounting/dto/create-expense.dto';
import { ReviewExpenseDto } from '@accounting/dto/review-expense.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Expense } from '@accounting/entities/expense.entity';
import { ExpenseStatus } from '@common/enums/expense-status.enum';

@Controller(APP_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // IMPORTANT: ledger/summary must come BEFORE ledger (static before dynamic)
  // Admin-only endpoints. Admins are not tied to a branch, so an optional
  // ?branchId= query narrows the result; omitting it returns cross-branch
  // totals.
  @Get(APP_ROUTES.ACCOUNTING.LEDGER_SUMMARY)
  @Roles(UserRole.ADMIN)
  getLedgerSummary(@Query('branchId') branchId?: string) {
    return this.accountingService.getLedgerSummary(branchId ?? null);
  }

  @Get(APP_ROUTES.ACCOUNTING.LEDGER)
  @Roles(UserRole.ADMIN)
  getLedger(
    @Query('branchId') branchId?: string,
    @Query('entryType') entryType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountingService.getLedgerEntries(branchId ?? null, {
      entryType,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post(APP_ROUTES.ACCOUNTING.EXPENSES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createExpense(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser()
    user: { id: string; role: UserRole; branchId: string | null },
  ): Promise<Expense> {
    return this.accountingService.createExpense(createExpenseDto, user);
  }

  @Get(APP_ROUTES.ACCOUNTING.EXPENSES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getExpenses(
    @CurrentUser() user: { role: UserRole; branchId: string | null },
    @Query('branchId') branchIdQuery?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<Expense[]> {
    // Managers always scoped to their own branch; admins can filter by query.
    const branchId =
      user.role === UserRole.MANAGER
        ? (user.branchId ?? undefined)
        : branchIdQuery || undefined;

    const parsedStatus =
      status && Object.values(ExpenseStatus).includes(status as ExpenseStatus)
        ? (status as ExpenseStatus)
        : undefined;

    if (user.role === UserRole.MANAGER && !user.branchId) {
      throw new ForbiddenException('Manager has no branch assigned');
    }

    return this.accountingService.getExpenses({
      branchId,
      status: parsedStatus,
      search,
    });
  }

  @Patch(APP_ROUTES.ACCOUNTING.EXPENSE_REVIEW)
  @Roles(UserRole.ADMIN)
  reviewExpense(
    @Param('id') id: string,
    @Body() dto: ReviewExpenseDto,
    @CurrentUser('id') reviewerId: string,
  ): Promise<Expense> {
    return this.accountingService.reviewExpense(id, dto, reviewerId);
  }

  @Delete(APP_ROUTES.ACCOUNTING.EXPENSE_BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deleteExpense(
    @Param('id') id: string,
    @CurrentUser()
    user: { id: string; role: UserRole; branchId: string | null },
  ): Promise<void> {
    return this.accountingService.deleteExpense(id, user);
  }

  @Get(APP_ROUTES.ACCOUNTING.PROFIT_LOSS)
  @Roles(UserRole.ADMIN)
  getProfitLoss(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Default to current month
    const now = new Date();
    const start =
      startDate ||
      new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    // Admins not tied to a branch — omit ?branchId= for cross-branch P&L.
    return this.accountingService.getProfitLoss(branchId ?? null, start, end);
  }
}
