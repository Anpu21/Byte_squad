import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReturnsService } from '@inventory/returns.service';
import { ExchangeService } from '@inventory/exchange.service';
import { LookupSaleQueryDto } from '@inventory/dto/lookup-sale-query.dto';
import { CreateSalesReturnDto } from '@inventory/dto/create-sales-return.dto';
import { CreateExchangeDto } from '@inventory/dto/create-exchange.dto';
import { ListReturnsQueryDto } from '@inventory/dto/list-returns-query.dto';
import { ReturnsAnalyticsQueryDto } from '@inventory/dto/returns-analytics-query.dto';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import {
  ExchangeResult,
  PaginatedSalesReturns,
  ReturnsAnalytics,
  SaleReturnLookup,
} from '@inventory/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.RETURNS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(
    private readonly service: ReturnsService,
    private readonly exchange: ExchangeService,
  ) {}

  // Cashiers process till refunds too — branch scoping is enforced in the
  // service (assertBranchAccess), so the till can only touch its own sales.
  @Get(APP_ROUTES.RETURNS.LOOKUP)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  lookup(
    @Query() query: LookupSaleQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<SaleReturnLookup> {
    return this.service.lookupSale(actor, query.invoiceNumber);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  create(
    @Body() dto: CreateSalesReturnDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<SalesReturn> {
    return this.service.createReturn(actor, dto);
  }

  // Exchange = return + replacement sale in one transaction. Branch scoping is
  // enforced in computeReturn (assertBranchAccess). X-Idempotency-Key guards
  // POS double-submit (a replay would otherwise double-refund + double-sell).
  @Post(APP_ROUTES.RETURNS.EXCHANGE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  createExchange(
    @Body() dto: CreateExchangeDto,
    @CurrentUser() actor: AuthUser,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<ExchangeResult> {
    return this.exchange.createExchange(actor, dto, idempotencyKey);
  }

  @Get(APP_ROUTES.RETURNS.ANALYTICS)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  analytics(
    @Query() query: ReturnsAnalyticsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ReturnsAnalytics> {
    return this.service.getAnalytics(actor, query);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  list(
    @Query() query: ListReturnsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<PaginatedSalesReturns> {
    return this.service.listReturns(actor, query);
  }
}
