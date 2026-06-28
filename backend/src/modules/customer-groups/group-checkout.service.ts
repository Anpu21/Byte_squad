import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateCheckoutResult,
  CustomerOrdersService,
} from '@/modules/customer-orders/customer-orders.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { GroupCartRepository } from '@/modules/customer-groups/group-cart.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { CheckoutGroupCartDto } from '@/modules/customer-groups/dto/checkout-group-cart.dto';
import type { AuthUser } from '@common/types/auth-user.type';

/**
 * Checkout for a group's shared cart. Any member may check out: the cart is
 * mapped to the storefront multi-branch checkout (reusing all of its pricing,
 * loyalty distribution and PayHere plumbing), the resulting orders are stamped
 * with the group, and the shared cart is cleared.
 */
@Injectable()
export class GroupCheckoutService {
  constructor(
    private readonly groups: CustomerGroupsService,
    private readonly cart: GroupCartRepository,
    private readonly customerOrders: CustomerOrdersService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async checkout(
    groupId: string,
    dto: CheckoutGroupCartDto,
    actor: AuthUser,
  ): Promise<CreateCheckoutResult> {
    await this.groups.assertMembership(groupId, actor.id);

    const items = await this.cart.listItems(groupId);
    if (items.length === 0) {
      throw new BadRequestException('Your group cart is empty');
    }

    const result = await this.customerOrders.createCheckout(
      {
        items: items.map((i) => ({
          productId: i.productId,
          branchId: i.branchId,
          unitId: i.unitId ?? undefined,
          quantity: Number(i.quantity),
          amount: i.amount != null ? Number(i.amount) : undefined,
        })),
        note: dto.note,
        paymentMode: dto.paymentMode,
      },
      actor.id,
      { customerGroupId: groupId },
    );

    // Orders now exist — clear the shared cart so it can't block a re-checkout.
    // PayHere settles asynchronously via its webhook; a later payment failure
    // cancels the orders (existing logic) but the cart is already empty, exactly
    // like the personal storefront cart after checkout.
    await this.cart.clear(groupId);
    this.gateway.broadcast('group-cart:changed', { groupId });

    return result;
  }
}
