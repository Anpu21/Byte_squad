import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PosService } from '@pos/pos.service.js';
import { PosWriteService } from '@pos/pos-write.service';
import { PosVoidService } from '@pos/pos-void.service';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto';
import { CreateSaleDto } from '@pos/dto/create-sale.dto';
import { SearchProductsQueryDto } from '@pos/dto/search-products-query.dto';
import { VoidSaleDto } from '@pos/dto/void-sale.dto';
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

// Class-level @Roles(...) is intentionally omitted: every method below
// declares its own @Roles(...) decorator, which NestJS treats as a full
// replacement (not a merge). The class-level annotation we used to carry
// here was dead code that misled readers into thinking it was a default.
@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly posWriteService: PosWriteService,
    private readonly posVoidService: PosVoidService,
  ) {}

  @Get(APP_ROUTES.POS.ADMIN_DASHBOARD)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAdminDashboard(): Promise<AdminDashboardData> {
    return this.posService.getAdminDashboard();
  }

  @Get(APP_ROUTES.POS.MY_DASHBOARD)
  @Roles(UserRole.CASHIER)
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
  @Roles(UserRole.CASHIER)
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
  @Roles(UserRole.CASHIER)
  findAll(@CurrentUser('branchId') branchId: string): Promise<Sale[]> {
    return this.posService.findAll(branchId);
  }

  @Get(APP_ROUTES.POS.TRANSACTION_BY_ID)
  @Roles(UserRole.CASHIER)
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

  @Get(APP_ROUTES.POS.GENERATE_INVOICE_NO)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  previewNextInvoiceNumber(): Promise<{ invoiceNo: string }> {
    return this.posService.previewNextInvoiceNumber();
  }

  // -------------------------------------------------------------------
  // Phase 5 — Shanel-aligned write endpoint
  // -------------------------------------------------------------------

  /**
   * `POST /pos/sales` — Shanel multi-tender checkout. Owns the full sale
   * orchestration (stock decrement, sale + payment insert, customer credit,
   * stock-movement log, ledger entry). Idempotency via `X-Idempotency-Key`
   * header; same key replays the original sale instead of creating a new one.
   */
  @Post(APP_ROUTES.POS.SALES)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  createSale(
    @CurrentUser() actor: ActorPayload,
    @Body() dto: CreateSaleDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<Sale> {
    return this.posWriteService.createSale(actor, dto, idempotencyKey);
  }

  // -------------------------------------------------------------------
  // Phase 6 — Shanel-aligned mutations (print, void)
  // -------------------------------------------------------------------

  /**
   * `PATCH /pos/sales/:id/print` — record a receipt print. Bumps
   * billPrintCount and refreshes lastPrintDate; the first print also
   * captures firstPrintDate. Branch-scoped for non-admins.
   */
  @Patch(APP_ROUTES.POS.SALE_PRINT)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  markSalePrinted(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Sale> {
    return this.posService.markPrinted(id, actor);
  }

  /**
   * `POST /pos/sales/:id/void` — reverse a completed sale. Admins and
   * managers only (cashiers cannot void). Restocks inventory, inserts
   * Sale_Voided stock-movement rows, reverses credit transactions and
   * the running balance on the customer, and writes a DEBIT ledger
   * entry equal to the original total. Already-voided sales return 409.
   */
  @Post(APP_ROUTES.POS.SALE_VOID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  voidSale(
    @Param('id') id: string,
    @Body() dto: VoidSaleDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Sale> {
    return this.posVoidService.voidSale(actor, id, dto.reason);
  }
}
