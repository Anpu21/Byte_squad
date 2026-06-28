import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupCartService } from '@/modules/customer-groups/group-cart.service';
import { GroupCartRepository } from '@/modules/customer-groups/group-cart.repository';
import { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';
import { ProductsService } from '@products/products.service';
import { BranchesService } from '@branches/branches.service';
import { RealtimePublisher } from '@common/realtime/realtime-publisher.service';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { GroupCartItem } from '@/modules/customer-groups/entities/group-cart-item.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';

const member: AuthUser = {
  id: 'u-member',
  email: 'member@x.com',
  role: UserRole.CUSTOMER,
  branchId: null,
};

function product(over: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Rice',
    sellingPrice: 100,
    baseUnit: 'kg',
    imageUrl: null,
    isActive: true,
    sellableUnits: [
      {
        id: 'u-base',
        name: 'kg',
        isBase: true,
        conversionToBase: 1,
        sellingPrice: 100,
      },
    ],
    ...over,
  } as unknown as Product;
}

function branch(over: Partial<Branch> = {}): Branch {
  return {
    id: 'b1',
    name: 'Main St',
    isActive: true,
    ...over,
  } as unknown as Branch;
}

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
    product: product(),
    branch: branch(),
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
  } as unknown as GroupCartItem;
}

describe('GroupCartService', () => {
  let service: GroupCartService;
  let groups: { assertMembership: jest.Mock };
  let cart: {
    listItems: jest.Mock;
    findById: jest.Mock;
    findSameLine: jest.Mock;
    createItem: jest.Mock;
    saveItem: jest.Mock;
    deleteItem: jest.Mock;
    clear: jest.Mock;
    countItems: jest.Mock;
  };
  let products: { findActiveByIdsWithUnits: jest.Mock };
  let branches: { findEntityById: jest.Mock };
  let realtime: { toGroup: jest.Mock };

  beforeEach(async () => {
    groups = { assertMembership: jest.fn().mockResolvedValue(undefined) };
    cart = {
      listItems: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findSameLine: jest.fn().mockResolvedValue(null),
      createItem: jest.fn((x: Partial<GroupCartItem>) => x),
      saveItem: jest.fn((x: GroupCartItem) => Promise.resolve(x)),
      deleteItem: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      countItems: jest.fn().mockResolvedValue(0),
    };
    products = {
      findActiveByIdsWithUnits: jest.fn().mockResolvedValue([product()]),
    };
    branches = { findEntityById: jest.fn().mockResolvedValue(branch()) };
    realtime = { toGroup: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GroupCartService,
        { provide: CustomerGroupsService, useValue: groups },
        { provide: GroupCartRepository, useValue: cart },
        { provide: ProductsService, useValue: products },
        { provide: BranchesService, useValue: branches },
        { provide: RealtimePublisher, useValue: realtime },
      ],
    }).compile();
    service = moduleRef.get(GroupCartService);
  });

  describe('addItem', () => {
    it('creates a new line and broadcasts a change', async () => {
      await service.addItem(
        'g1',
        { productId: 'p1', branchId: 'b1', quantity: 2 },
        member,
      );
      expect(cart.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          customerGroupId: 'g1',
          productId: 'p1',
          branchId: 'b1',
          unitId: null,
          quantity: 2,
          amount: null,
          addedByUserId: 'u-member',
        }),
      );
      expect(realtime.toGroup).toHaveBeenCalledWith('g1', 'group-cart:changed', {
        groupId: 'g1',
      });
    });

    it('merges into an existing same-line by summing quantity', async () => {
      cart.findSameLine.mockResolvedValue(cartItem({ quantity: 3 }));
      await service.addItem(
        'g1',
        { productId: 'p1', branchId: 'b1', quantity: 2 },
        member,
      );
      expect(cart.createItem).not.toHaveBeenCalled();
      expect(cart.saveItem).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
    });

    it('stores a valid buy-by-amount line', async () => {
      await service.addItem(
        'g1',
        { productId: 'p1', branchId: 'b1', quantity: 2, amount: 200 },
        member,
      );
      expect(cart.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 200 }),
      );
    });

    it('rejects an amount that does not reconcile with qty × price', async () => {
      await expect(
        service.addItem(
          'g1',
          { productId: 'p1', branchId: 'b1', quantity: 2, amount: 999 },
          member,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unavailable product', async () => {
      products.findActiveByIdsWithUnits.mockResolvedValue([]);
      await expect(
        service.addItem(
          'g1',
          { productId: 'p1', branchId: 'b1', quantity: 1 },
          member,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an inactive branch', async () => {
      branches.findEntityById.mockResolvedValue(branch({ isActive: false }));
      await expect(
        service.addItem(
          'g1',
          { productId: 'p1', branchId: 'b1', quantity: 1 },
          member,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid unit', async () => {
      await expect(
        service.addItem(
          'g1',
          { productId: 'p1', branchId: 'b1', unitId: 'u-nope', quantity: 1 },
          member,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a non-member (assertMembership throws)', async () => {
      groups.assertMembership.mockRejectedValue(new ForbiddenException());
      await expect(
        service.addItem(
          'g1',
          { productId: 'p1', branchId: 'b1', quantity: 1 },
          member,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setItemQty', () => {
    it('updates the quantity of an owned line', async () => {
      cart.findById.mockResolvedValue(cartItem());
      await service.setItemQty('g1', 'i1', { quantity: 4 }, member);
      expect(cart.saveItem).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 4 }),
      );
      expect(realtime.toGroup).toHaveBeenCalled();
    });

    it('404s when the item is missing or belongs to another group', async () => {
      cart.findById.mockResolvedValue(null);
      await expect(
        service.setItemQty('g1', 'i9', { quantity: 4 }, member),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('deletes the line and broadcasts', async () => {
      cart.findById.mockResolvedValue(cartItem());
      await service.removeItem('g1', 'i1', member);
      expect(cart.deleteItem).toHaveBeenCalledWith('i1');
      expect(realtime.toGroup).toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('clears the cart and broadcasts', async () => {
      await service.clearCart('g1', member);
      expect(cart.clear).toHaveBeenCalledWith('g1');
      expect(realtime.toGroup).toHaveBeenCalled();
    });
  });

  describe('getCart', () => {
    it('resolves live prices and rolls up the total', async () => {
      cart.listItems.mockResolvedValue([cartItem({ quantity: 2 })]);
      const view = await service.getCart('g1', member.id);
      expect(view.itemCount).toBe(1);
      expect(view.items[0].lineTotal).toBe(200);
      expect(view.items[0].unitPrice).toBe(100);
      expect(view.total).toBe(200);
    });
  });
});
