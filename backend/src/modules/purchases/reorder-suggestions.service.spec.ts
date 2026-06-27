/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { ReorderSuggestionsService } from './reorder-suggestions.service';
import {
  ReorderSuggestionsRepository,
  type ReorderInventoryRow,
} from './reorder-suggestions.repository';
import { PurchaseOrdersService } from './purchase-orders.service';
import type { PurchaseOrder } from './entities/purchase-order.entity';

const BRANCH_A = 'branch-A';
const MANAGER = { id: 'mgr-1', role: UserRole.MANAGER, branchId: BRANCH_A };
const ADMIN = { id: 'adm-1', role: UserRole.ADMIN, branchId: null };

function inv(
  overrides: Partial<ReorderInventoryRow> = {},
): ReorderInventoryRow {
  return {
    productId: 'p1',
    productName: 'Milk',
    baseUnit: 'L',
    costPrice: 100,
    onHand: 0,
    lowStockThreshold: 10,
    ...overrides,
  };
}

describe('ReorderSuggestionsService', () => {
  let service: ReorderSuggestionsService;
  let repo: jest.Mocked<ReorderSuggestionsRepository>;
  let orders: jest.Mocked<PurchaseOrdersService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReorderSuggestionsService,
        {
          provide: ReorderSuggestionsRepository,
          useValue: {
            inventoryForBranch: jest.fn().mockResolvedValue([]),
            salesQtyByProduct: jest.fn().mockResolvedValue(new Map()),
            onOrderByProduct: jest.fn().mockResolvedValue(new Map()),
            lastSupplierByProduct: jest.fn().mockResolvedValue(new Map()),
          },
        },
        { provide: PurchaseOrdersService, useValue: { create: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(ReorderSuggestionsService);
    repo = moduleRef.get(ReorderSuggestionsRepository);
    orders = moduleRef.get(PurchaseOrdersService);
  });

  describe('suggest', () => {
    it('computes a per-supplier shortfall from velocity, safety, on-hand, on-order', async () => {
      repo.inventoryForBranch.mockResolvedValue([
        inv({ productId: 'p1', onHand: 2, lowStockThreshold: 10 }),
      ]);
      // 30 sold over a 30-day window = 1/day.
      repo.salesQtyByProduct.mockResolvedValue(new Map([['p1', 30]]));
      repo.onOrderByProduct.mockResolvedValue(new Map([['p1', 1]]));
      repo.lastSupplierByProduct.mockResolvedValue(
        new Map([
          ['p1', { supplierId: 's1', supplierName: 'Acme', unitCost: 90 }],
        ]),
      );

      const report = await service.suggest(
        { leadDays: 7, lookbackDays: 30 },
        MANAGER,
      );

      // 1/day × 7 lead + 10 safety − 2 onHand − 1 onOrder = 14
      expect(report.groups).toHaveLength(1);
      expect(report.groups[0]?.supplierId).toBe('s1');
      const line = report.groups[0]?.lines[0];
      expect(line?.suggestedQty).toBe(14);
      expect(line?.unitCost).toBe(90);
      expect(report.groups[0]?.totalValue).toBe(14 * 90);
    });

    it('skips well-stocked products', async () => {
      repo.inventoryForBranch.mockResolvedValue([
        inv({ productId: 'p2', onHand: 100, lowStockThreshold: 10 }),
      ]);
      repo.lastSupplierByProduct.mockResolvedValue(
        new Map([
          ['p2', { supplierId: 's1', supplierName: 'Acme', unitCost: 5 }],
        ]),
      );
      const report = await service.suggest({}, MANAGER);
      expect(report.groups).toHaveLength(0);
    });

    it('counts products with no supplier history as unassigned', async () => {
      repo.inventoryForBranch.mockResolvedValue([
        inv({ productId: 'p3', onHand: 0, lowStockThreshold: 5 }),
      ]);
      const report = await service.suggest({}, MANAGER);
      expect(report.groups).toHaveLength(0);
      expect(report.unassignedCount).toBe(1);
    });

    it('falls back to product cost when the last GRN unit cost is zero', async () => {
      repo.inventoryForBranch.mockResolvedValue([
        inv({
          productId: 'p1',
          onHand: 0,
          lowStockThreshold: 5,
          costPrice: 42,
        }),
      ]);
      repo.lastSupplierByProduct.mockResolvedValue(
        new Map([
          ['p1', { supplierId: 's1', supplierName: 'Acme', unitCost: 0 }],
        ]),
      );
      const report = await service.suggest({}, MANAGER);
      expect(report.groups[0]?.lines[0]?.unitCost).toBe(42);
    });

    it('requires a branchId for admins', async () => {
      await expect(service.suggest({}, ADMIN)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('draft', () => {
    it('creates one PO per order through the PO service', async () => {
      orders.create.mockImplementation((dto) =>
        Promise.resolve({ id: `po-${dto.supplierId}` } as PurchaseOrder),
      );
      const result = await service.draft(
        {
          orders: [
            {
              supplierId: 's1',
              items: [{ productId: 'p1', quantity: 14, unitCost: 90 }],
            },
            {
              supplierId: 's2',
              items: [{ productId: 'p2', quantity: 3, unitCost: 5 }],
            },
          ],
        },
        MANAGER,
      );
      expect(orders.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
