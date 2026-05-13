import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomerOrdersService } from '@/modules/customer-orders/customer-orders.service';
import { CreateCustomerOrderDto } from '@/modules/customer-orders/dto/create-customer-order.dto';
import { FulfillCustomerOrderDto } from '@/modules/customer-orders/dto/fulfill-customer-order.dto';
import { ListCustomerOrdersQueryDto } from '@/modules/customer-orders/dto/list-customer-orders-query.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import type { PayhereNotifyPayload } from '@/modules/customer-orders/payhere.service';

@Controller(APP_ROUTES.CUSTOMER_ORDERS.BASE)
export class CustomerOrdersController {
  constructor(private readonly service: CustomerOrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(
    @Body() dto: CreateCustomerOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Post(APP_ROUTES.CUSTOMER_ORDERS.PAYHERE_NOTIFY)
  @Public()
  handlePayhereNotify(@Body() payload: PayhereNotifyPayload) {
    return this.service.handlePayhereNotify(payload);
  }

  @Get(APP_ROUTES.CUSTOMER_ORDERS.MINE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  listMine(@CurrentUser('id') userId: string) {
    return this.service.listForUser(userId);
  }

  @Get(APP_ROUTES.CUSTOMER_ORDERS.BY_CODE)
  @Public()
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  list(
    @Query() query: ListCustomerOrdersQueryDto,
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.listForStaff(actor, query);
  }

  @Patch(APP_ROUTES.CUSTOMER_ORDERS.CANCEL)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.cancelByUser(id, userId);
  }

  @Patch(APP_ROUTES.CUSTOMER_ORDERS.ACCEPT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  accept(
    @Param('id') id: string,
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.acceptByStaff(id, actor);
  }

  @Patch(APP_ROUTES.CUSTOMER_ORDERS.REJECT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  reject(
    @Param('id') id: string,
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.rejectByStaff(id, actor);
  }

  @Post(APP_ROUTES.CUSTOMER_ORDERS.FULFILL)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  fulfill(
    @Param('code') code: string,
    @Body() dto: FulfillCustomerOrderDto,
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.fulfill(code, dto, actor);
  }
}
