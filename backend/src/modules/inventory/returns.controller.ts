import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ReturnsService } from '@inventory/returns.service';
import { LookupSaleQueryDto } from '@inventory/dto/lookup-sale-query.dto';
import { CreateSalesReturnDto } from '@inventory/dto/create-sales-return.dto';
import { ListReturnsQueryDto } from '@inventory/dto/list-returns-query.dto';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { PaginatedSalesReturns, SaleReturnLookup } from '@inventory/types';
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
  constructor(private readonly service: ReturnsService) {}

  @Get(APP_ROUTES.RETURNS.LOOKUP)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  lookup(
    @Query() query: LookupSaleQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<SaleReturnLookup> {
    return this.service.lookupSale(actor, query.invoiceNumber);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateSalesReturnDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<SalesReturn> {
    return this.service.createReturn(actor, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListReturnsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<PaginatedSalesReturns> {
    return this.service.listReturns(actor, query);
  }
}
