import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { GroupCheckoutService } from '@/modules/customer-groups/group-checkout.service';
import { CheckoutGroupCartDto } from '@/modules/customer-groups/dto/checkout-group-cart.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';
import type { CreateCheckoutResult } from '@/modules/customer-orders/customer-orders.service';

@Controller(APP_ROUTES.CUSTOMER_GROUPS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class GroupCheckoutController {
  constructor(private readonly service: GroupCheckoutService) {}

  @Post(APP_ROUTES.CUSTOMER_GROUPS.CHECKOUT)
  checkout(
    @Param('id') id: string,
    @Body() dto: CheckoutGroupCartDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CreateCheckoutResult> {
    return this.service.checkout(id, dto, actor);
  }
}
