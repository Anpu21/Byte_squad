import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { PosService } from '@pos/pos.service.js';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto';
import { SearchProductsQueryDto } from '@pos/dto/search-products-query.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Sale } from '@pos/entities/sale.entity';
import type {
  CashierDashboardData,
  AdminDashboardData,
  CashierTransactionsSummary,
  SearchProductRow,
  ProductUnitRow,
  InventoryQuantity,
  RecentSaleRow,
} from '@pos/types';

interface ActorPayload {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

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
  ): Promise<Sale> {
    return this.posService.createTransaction(
      createTransactionDto,
      cashierId,
      branchId,
      idempotencyKey,
    );
  }

  @Get(APP_ROUTES.POS.TRANSACTIONS)
  findAll(@CurrentUser('branchId') branchId: string): Promise<Sale[]> {
    return this.posService.findAll(branchId);
  }

  @Get(APP_ROUTES.POS.TRANSACTION_BY_ID)
  findOne(@Param('id') id: string): Promise<Sale | null> {
    return this.posService.findById(id);
  }

  // -------------------------------------------------------------------
  // Phase 4 — Shanel-aligned read endpoints
  // -------------------------------------------------------------------

  @Get(APP_ROUTES.POS.SEARCH_PRODUCTS)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  searchProducts(
    @CurrentUser() actor: ActorPayload,
    @Query() query: SearchProductsQueryDto,
  ): Promise<SearchProductRow[]> {
    return this.posService.searchProducts(actor, query);
  }

  @Get(APP_ROUTES.POS.PRODUCT_UNITS)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  listProductUnits(
    @Param('productId') productId: string,
  ): Promise<ProductUnitRow[]> {
    return this.posService.listProductUnits(productId);
  }

  @Get(APP_ROUTES.POS.BASE_UNIT_QTY)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  getBaseUnitQty(
    @Param('productId') productId: string,
    @Param('unitName') unitName: string,
  ): Promise<{ conversionToBase: number; isBase: boolean }> {
    return this.posService.getBaseUnitQty(productId, unitName);
  }

  @Get(APP_ROUTES.POS.PRODUCT_INVENTORY)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  getProductInventory(
    @CurrentUser() actor: ActorPayload,
    @Param('productId') productId: string,
  ): Promise<InventoryQuantity> {
    return this.posService.getProductInventory(actor, productId);
  }

  @Get(APP_ROUTES.POS.RECENT_SALES)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  getRecentSales(
    @CurrentUser() actor: ActorPayload,
    @Query('limit') limit?: string,
  ): Promise<RecentSaleRow[]> {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    return this.posService.getRecentSales(actor, parsedLimit);
  }
}
