import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { CreateCustomerGroupDto } from '@/modules/customer-groups/dto/create-customer-group.dto';
import { JoinCustomerGroupDto } from '@/modules/customer-groups/dto/join-customer-group.dto';
import { UpdateCustomerGroupDto } from '@/modules/customer-groups/dto/update-customer-group.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';
import type {
  CustomerGroupDetail,
  CustomerGroupSummary,
} from '@/modules/customer-groups/types';

/**
 * Customer shopping groups — all CUSTOMER-role and membership-scoped (the
 * service asserts the caller belongs to / owns the group). Static segments
 * (`mine`, `join`) are declared before `:id` so they aren't captured by the
 * param route.
 */
@Controller(APP_ROUTES.CUSTOMER_GROUPS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CustomerGroupsController {
  constructor(private readonly service: CustomerGroupsService) {}

  @Post()
  create(
    @Body() dto: CreateCustomerGroupDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    return this.service.create(dto, actor);
  }

  @Get(APP_ROUTES.CUSTOMER_GROUPS.MINE)
  listMine(@CurrentUser() actor: AuthUser): Promise<CustomerGroupSummary[]> {
    return this.service.listMine(actor);
  }

  @Post(APP_ROUTES.CUSTOMER_GROUPS.JOIN)
  join(
    @Body() dto: JoinCustomerGroupDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    return this.service.join(dto, actor);
  }

  @Get(APP_ROUTES.CUSTOMER_GROUPS.BY_ID)
  getById(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    return this.service.getById(id, actor.id);
  }

  @Patch(APP_ROUTES.CUSTOMER_GROUPS.BY_ID)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerGroupDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    return this.service.update(id, dto, actor);
  }

  @Post(APP_ROUTES.CUSTOMER_GROUPS.REGENERATE_CODE)
  regenerateCode(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    return this.service.regenerateCode(id, actor);
  }

  @Post(APP_ROUTES.CUSTOMER_GROUPS.LEAVE)
  leave(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.service.leave(id, actor);
  }

  @Delete(APP_ROUTES.CUSTOMER_GROUPS.MEMBER)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<CustomerGroupDetail> {
    return this.service.removeMember(id, userId, actor);
  }
}
