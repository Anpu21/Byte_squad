/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { Inventory } from './entities/inventory.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<InventoryRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<InventoryRepository>> = {
      createAndSave: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByProductAndBranch: jest.fn(),
      findLowStock: jest.fn(),
      findByBranchPaged: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: InventoryRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get(InventoryService);
    repo = module.get(InventoryRepository);
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
