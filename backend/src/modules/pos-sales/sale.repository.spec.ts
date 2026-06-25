import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SaleRepository } from '@/modules/pos-sales/sale.repository';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';

interface FakeRepo {
  save: jest.Mock;
  create: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
}

describe('SaleRepository', () => {
  let repo: SaleRepository;
  let typeormRepo: FakeRepo;
  let dataSource: { getRepository: jest.Mock };

  beforeEach(async () => {
    typeormRepo = {
      save: jest.fn(),
      create: jest.fn((x: unknown) => x),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue(typeormRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleRepository,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    repo = module.get(SaleRepository);
  });

  describe('findOneById', () => {
    it('eager-loads items.product and items.unit so receipts can render the unit suffix', async () => {
      const dummy: Partial<Sale> = { id: 'sale-1' };
      typeormRepo.findOne.mockResolvedValue(dummy);

      const out = await repo.findOneById('sale-1');

      expect(out).toBe(dummy);
      expect(typeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sale-1' },
        relations: [
          'items',
          'items.product',
          'items.unit',
          'cashier',
          'customer',
        ],
      });
    });

    it('returns null when no sale matches', async () => {
      typeormRepo.findOne.mockResolvedValue(null);
      const out = await repo.findOneById('missing');
      expect(out).toBeNull();
    });
  });

  describe('findOneByIdScopedToBranch', () => {
    it('eager-loads items.product and items.unit with a branch filter', async () => {
      const dummy: Partial<Sale> = { id: 'sale-2', branchId: 'b-1' };
      typeormRepo.findOne.mockResolvedValue(dummy);

      const out = await repo.findOneByIdScopedToBranch('sale-2', 'b-1');

      expect(out).toBe(dummy);
      expect(typeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sale-2', branchId: 'b-1' },
        relations: [
          'items',
          'items.product',
          'items.unit',
          'cashier',
          'customer',
        ],
      });
    });
  });

  describe('markPrinted', () => {
    it('throws NotFoundException when no sale matches the id', async () => {
      typeormRepo.update.mockResolvedValueOnce({ affected: 0 });

      const now = new Date();
      await expect(
        repo.markPrinted('missing', {
          billPrinted: true,
          billPrintCount: 1,
          firstPrintDate: now,
          lastPrintDate: now,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('voidById', () => {
    it('throws NotFoundException when no sale matches the id', async () => {
      typeormRepo.update.mockResolvedValueOnce({ affected: 0 });
      await expect(
        repo.voidById('missing', 'user-1', 'mistake'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
