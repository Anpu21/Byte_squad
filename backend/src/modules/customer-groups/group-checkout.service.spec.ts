import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GroupCheckoutService } from '@/modules/customer-groups/group-checkout.service';
import { GroupCartRepository } from '@/modules/customer-groups/group-cart.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { CustomerOrdersService } from '@/modules/customer-orders/customer-orders.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { GroupCartItem } from '@/modules/customer-groups/entities/group-cart-item.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';

const member: AuthUser = {
  id: 'u-member',
  email: 'member@x.com',
  role: UserRole.CUSTOMER,
  branchId: null,
};

function cartItem(over: Partial<GroupCartItem> = {}): GroupCartItem {
  return {
    id: 'i1',
    customerGroupId: 'g1',
    productId: 'p1',
    branchId: 'b1',
    unitId: null,
    quantity: 2,
    amount: null,
    addedByUserId: 'u-member',
    ...over,
  } as unknown as GroupCartItem;
}

describe('GroupCheckoutService', () => {
  let service: GroupCheckoutService;
  let groups: { assertMembership: jest.Mock };
  let cart: { listItems: jest.Mock; clear: jest.Mock };
  let customerOrders: { createCheckout: jest.Mock };
  let gateway: { broadcast: jest.Mock };

  beforeEach(async () => {
    groups = { assertMembership: jest.fn().mockResolvedValue(undefined) };
    cart = {
      listItems: jest.fn().mockResolvedValue([cartItem()]),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    customerOrders = {
      createCheckout: jest
        .fn()
        .mockResolvedValue({ groupCode: 'GRP-1', orders: [], payment: null }),
    };
    gateway = { broadcast: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GroupCheckoutService,
        { provide: CustomerGroupsService, useValue: groups },
        { provide: GroupCartRepository, useValue: cart },
        { provide: CustomerOrdersService, useValue: customerOrders },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();
    service = moduleRef.get(GroupCheckoutService);
  });

  it('maps the cart to a checkout stamped with the group, then clears it', async () => {
    const res = await service.checkout('g1', {}, member);
    expect(customerOrders.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            productId: 'p1',
            branchId: 'b1',
            quantity: 2,
          }),
        ],
      }),
      'u-member',
      { customerGroupId: 'g1' },
    );
    expect(cart.clear).toHaveBeenCalledWith('g1');
    expect(gateway.broadcast).toHaveBeenCalledWith('group-cart:changed', {
      groupId: 'g1',
    });
    expect(res.groupCode).toBe('GRP-1');
  });

  it('rejects an empty cart and never creates orders', async () => {
    cart.listItems.mockResolvedValue([]);
    await expect(service.checkout('g1', {}, member)).rejects.toThrow(
      BadRequestException,
    );
    expect(customerOrders.createCheckout).not.toHaveBeenCalled();
  });

  it('rejects a non-member', async () => {
    groups.assertMembership.mockRejectedValue(new ForbiddenException());
    await expect(service.checkout('g1', {}, member)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
