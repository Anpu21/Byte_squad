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
import { CustomerRequestsService } from '@/modules/customer-requests/customer-requests.service';
import { CreateCustomerRequestDto } from '@/modules/customer-requests/dto/create-customer-request.dto';
import { FulfillCustomerRequestDto } from '@/modules/customer-requests/dto/fulfill-customer-request.dto';
import { ListCustomerRequestsQueryDto } from '@/modules/customer-requests/dto/list-customer-requests-query.dto';
import { CustomerJwtAuthGuard } from '@/modules/customers/guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from '@/modules/customers/guards/optional-customer-jwt-auth.guard';
import { CurrentCustomer } from '@/modules/customers/decorators/current-customer.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.CUSTOMER_REQUESTS.BASE)
export class CustomerRequestsController {
  constructor(private readonly service: CustomerRequestsService) {}

  @Post()
  @UseGuards(OptionalCustomerJwtAuthGuard)
  create(
    @Body() dto: CreateCustomerRequestDto,
    @CurrentCustomer('id') customerId: string | null,
  ) {
    return this.service.create(dto, customerId);
  }

  @Get(APP_ROUTES.CUSTOMER_REQUESTS.MINE)
  @UseGuards(CustomerJwtAuthGuard)
  listMine(@CurrentCustomer('id') customerId: string) {
    return this.service.listForCustomer(customerId);
  }

  @Get(APP_ROUTES.CUSTOMER_REQUESTS.BY_CODE)
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  list(
    @Query() query: ListCustomerRequestsQueryDto,
    @CurrentUser() actor: { id: string; role: UserRole; branchId: string },
  ) {
    return this.service.listForStaff(actor, query);
  }

  @Patch(APP_ROUTES.CUSTOMER_REQUESTS.CANCEL)
  @UseGuards(CustomerJwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentCustomer('id') customerId: string) {
    return this.service.cancelByCustomer(id, customerId);
  }

  @Patch(APP_ROUTES.CUSTOMER_REQUESTS.REJECT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  reject(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string; role: UserRole; branchId: string },
  ) {
    return this.service.rejectByStaff(id, actor);
  }

  @Post(APP_ROUTES.CUSTOMER_REQUESTS.FULFILL)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  fulfill(
    @Param('code') code: string,
    @Body() dto: FulfillCustomerRequestDto,
    @CurrentUser() actor: { id: string; role: UserRole; branchId: string },
  ) {
    return this.service.fulfill(code, dto, actor);
  }
}
