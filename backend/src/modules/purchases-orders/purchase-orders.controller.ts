import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  PurchaseOrdersService,
  type PurchaseOrdersListResponse,
} from '@/modules/purchases-orders/purchase-orders.service';
import { PurchaseOrder } from '@/modules/purchases-orders/entities/purchase-order.entity';
import { CreatePurchaseOrderDto } from '@/modules/purchases-orders/dto/create-purchase-order.dto';
import { ListPurchaseOrdersQueryDto } from '@/modules/purchases-orders/dto/list-purchase-orders-query.dto';
import type { PurchasesActor } from '@/modules/purchases-grn/types/purchases-actor.type';

@Controller(APP_ROUTES.PURCHASES.ORDERS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly orders: PurchaseOrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListPurchaseOrdersQueryDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseOrdersListResponse> {
    return this.orders.list(query, actor);
  }

  @Get(APP_ROUTES.PURCHASES.ORDERS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseOrder> {
    return this.orders.getById(id, actor);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseOrder> {
    return this.orders.create(dto, actor);
  }

  @Patch(APP_ROUTES.PURCHASES.ORDERS.SEND)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseOrder> {
    return this.orders.send(id, actor);
  }

  @Patch(APP_ROUTES.PURCHASES.ORDERS.CANCEL)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseOrder> {
    return this.orders.cancel(id, actor);
  }
}
