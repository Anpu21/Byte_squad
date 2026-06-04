/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { Inventory } from './entities/inventory.entity';
import { ProductsRepository } from '@products/products.repository';
import { Product } from '@products/entities/product.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<InventoryRepository>;
  let products: jest.Mocked<ProductsRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<InventoryRepository>> = {
      createAndSave: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByProductAndBranch: jest.fn(),
      findLowStock: jest.fn(),
      findByBranchPaged: jest.fn(),
    };
    const productsMock: Partial<jest.Mocked<ProductsRepository>> = {
      findById: jest.fn().mockResolvedValue({
        id: 'p',
        baseUnit: 'unit',
      } as Product),
    };

    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: InventoryRepository, useValue: repoMock },
        { provide: ProductsRepository, useValue: productsMock },
      ],
    }).compile();

    service = module.get(InventoryService);
    repo = module.get(InventoryRepository);
    products = module.get(ProductsRepository);
  });

  describe('checkLowStockByProductAndBranch', () => {
    it('returns false when no inventory row exists', async () => {
      repo.findByProductAndBranch.mockResolvedValue(null);
      expect(await service.checkLowStockByProductAndBranch('p', 'b')).toBe(
        false,
      );
    });

    it('returns true when quantity is at or below the threshold', async () => {
      repo.findByProductAndBranch.mockResolvedValue({
        quantity: 3,
        lowStockThreshold: 5,
      } as Inventory);
      expect(await service.checkLowStockByProductAndBranch('p', 'b')).toBe(
        true,
      );
    });

    it('returns false when stock is comfortably above the threshold', async () => {
      repo.findByProductAndBranch.mockResolvedValue({
        quantity: 50,
        lowStockThreshold: 10,
      } as Inventory);
      expect(await service.checkLowStockByProductAndBranch('p', 'b')).toBe(
        false,
      );
    });
  });

  describe('updateStock', () => {
    it('writes through the repo and refetches the row', async () => {
      const updated = { id: 'i1', quantity: 7 } as Inventory;
      repo.findById.mockResolvedValue(updated);
      const result = await service.updateStock('i1', {
        productId: 'p',
        branchId: 'b',
        quantity: 7,
      });
      expect(repo.update).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({ quantity: 7 }),
      );
      expect(result).toBe(updated);
    });

    it('allows decimal quantities up to 3 places for KG and L products', async () => {
      products.findById.mockResolvedValue({
        id: 'p',
        baseUnit: 'kg',
      } as Product);
      const updated = { id: 'i1', quantity: 1.001 } as Inventory;
      repo.findById.mockResolvedValue(updated);

      const result = await service.updateStock('i1', {
        productId: 'p',
        branchId: 'b',
        quantity: 1.001,
      });

      expect(repo.update).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({ quantity: 1.001 }),
      );
      expect(result).toBe(updated);
    });

    it('rejects fractional quantities for UNIT products', async () => {
      await expect(
        service.updateStock('i1', {
          productId: 'p',
          branchId: 'b',
          quantity: 7.125,
        }),
      ).rejects.toThrow('UNIT stock quantity must be a whole number');
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('skips lastRestockedAt when initial quantity is zero', async () => {
      await service.create({ productId: 'p', branchId: 'b', quantity: 0 });
      expect(repo.createAndSave).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 0, lastRestockedAt: null }),
      );
    });
  });
});
