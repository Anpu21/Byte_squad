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
import { GroupCartService } from '@/modules/customer-groups/group-cart.service';
import { AddGroupCartItemDto } from '@/modules/customer-groups/dto/add-group-cart-item.dto';
import { SetGroupCartItemQtyDto } from '@/modules/customer-groups/dto/set-group-cart-item-qty.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';
import type { GroupCartView } from '@/modules/customer-groups/types';

/**
 * A group's shared cart — CUSTOMER-role, membership-scoped (the service asserts
 * the caller belongs to the group). Shares the `customer-groups` base path with
 * CustomerGroupsController; the cart routes live under `:id/cart`.
 */
@Controller(APP_ROUTES.CUSTOMER_GROUPS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class GroupCartController {
  constructor(private readonly service: GroupCartService) {}

  @Get(APP_ROUTES.CUSTOMER_GROUPS.CART)
  getCart(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<GroupCartView> {
    return this.service.getCart(id, actor.id);
  }

  @Post(APP_ROUTES.CUSTOMER_GROUPS.CART)
  add(
    @Param('id') id: string,
    @Body() dto: AddGroupCartItemDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<GroupCartView> {
    return this.service.addItem(id, dto, actor);
  }

  @Patch(APP_ROUTES.CUSTOMER_GROUPS.CART_ITEM)
  setQty(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: SetGroupCartItemQtyDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<GroupCartView> {
    return this.service.setItemQty(id, itemId, dto, actor);
  }

  @Delete(APP_ROUTES.CUSTOMER_GROUPS.CART_ITEM)
  remove(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<GroupCartView> {
    return this.service.removeItem(id, itemId, actor);
  }

  @Delete(APP_ROUTES.CUSTOMER_GROUPS.CART)
  clear(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<GroupCartView> {
    return this.service.clearCart(id, actor);
  }
}
