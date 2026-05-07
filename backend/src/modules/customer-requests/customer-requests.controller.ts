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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(
    @Body() dto: CreateCustomerRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Get(APP_ROUTES.CUSTOMER_REQUESTS.MINE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  listMine(@CurrentUser('id') userId: string) {
    return this.service.listForUser(userId);
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
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.listForStaff(actor, query);
  }

  @Patch(APP_ROUTES.CUSTOMER_REQUESTS.CANCEL)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.cancelByUser(id, userId);
  }

  @Patch(APP_ROUTES.CUSTOMER_REQUESTS.REJECT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  reject(
    @Param('id') id: string,
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.rejectByStaff(id, actor);
  }

  @Post(APP_ROUTES.CUSTOMER_REQUESTS.FULFILL)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  fulfill(
    @Param('code') code: string,
    @Body() dto: FulfillCustomerRequestDto,
    @CurrentUser()
    actor: { id: string; role: UserRole; branchId: string | null },
  ) {
    return this.service.fulfill(code, dto, actor);
  }
}
