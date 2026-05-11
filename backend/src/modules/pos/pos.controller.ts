import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { PosService } from '@pos/pos.service.js';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Transaction } from '@pos/entities/transaction.entity';
import type {
  CashierDashboardData,
  AdminDashboardData,
  CashierTransactionsSummary,
} from '@pos/types';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CASHIER)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get(APP_ROUTES.POS.ADMIN_DASHBOARD)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAdminDashboard(): Promise<AdminDashboardData> {
    return this.posService.getAdminDashboard();
  }

  @Get(APP_ROUTES.POS.MY_DASHBOARD)
  getCashierDashboard(
    @CurrentUser('id') cashierId: string,
    @CurrentUser('branchId') branchId: string,
  ): Promise<CashierDashboardData> {
    return this.posService.getCashierDashboard(cashierId, branchId);
  }

  @Get(APP_ROUTES.POS.MY_TRANSACTIONS)
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
  getMyTransactions(
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('role') role: UserRole,
  ): Promise<CashierTransactionsSummary> {
    const cashierId = role === UserRole.CASHIER ? userId : null;
    return this.posService.getTransactionsSummary(branchId, cashierId);
  }

  @Get(APP_ROUTES.POS.ALL_TRANSACTIONS)
  @Roles(UserRole.ADMIN)
  getAllTransactions(): Promise<CashierTransactionsSummary> {
    return this.posService.getAllTransactionsSummary();
  }

  @Post(APP_ROUTES.POS.TRANSACTIONS)
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser('id') cashierId: string,
    @CurrentUser('branchId') branchId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<Transaction> {
    return this.posService.createTransaction(
      createTransactionDto,
      cashierId,
      branchId,
      idempotencyKey,
    );
  }

  @Get(APP_ROUTES.POS.TRANSACTIONS)
  findAll(@CurrentUser('branchId') branchId: string): Promise<Transaction[]> {
    return this.posService.findAll(branchId);
  }

  @Get(APP_ROUTES.POS.TRANSACTION_BY_ID)
  findOne(@Param('id') id: string): Promise<Transaction | null> {
    return this.posService.findById(id);
  }
}
