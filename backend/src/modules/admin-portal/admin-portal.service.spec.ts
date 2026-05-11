/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { AdminPortalService } from './admin-portal.service';
import { BranchesRepository } from '@branches/branches.repository';
import { UsersRepository } from '@users/users.repository';
import { InventoryRepository } from '@inventory/inventory.repository';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Product } from '@products/entities/product.entity';
import { Expense } from '@accounting/entities/expense.entity';

describe('AdminPortalService.getBranchComparison', () => {
  let service: AdminPortalService;
  let branches: jest.Mocked<BranchesRepository>;

  beforeEach(async () => {
    const branchesMock: Partial<jest.Mocked<BranchesRepository>> = {
      findByIds: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AdminPortalService,
        { provide: BranchesRepository, useValue: branchesMock },
        {
          provide: UsersRepository,
          useValue: {
            countByBranch: jest.fn(),
            findFirstByBranchAndRole: jest.fn(),
            findAllByRoleWithBranch: jest.fn(),
            findAllWithBranch: jest.fn(),
          },
        },
        {
          provide: InventoryRepository,
          useValue: {
            findByProductIds: jest.fn(),
            countActiveForBranch: jest.fn(),
            countLowStockForBranch: jest.fn(),
          },
        },
        { provide: getRepositoryToken(Transaction), useValue: {} },
        { provide: getRepositoryToken(TransactionItem), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(Expense), useValue: {} },
      ],
    }).compile();

    service = module.get(AdminPortalService);
    branches = module.get(BranchesRepository);
  });

  it('rejects empty branchIds before any DB call', async () => {
    await expect(
      service.getBranchComparison([], new Date(), new Date()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(branches.findByIds).not.toHaveBeenCalled();
  });

  it('rejects when startDate is after endDate', async () => {
    await expect(
      service.getBranchComparison(
        ['b1'],
        new Date('2026-02-01'),
        new Date('2026-01-01'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when no matching branches are found', async () => {
    branches.findByIds.mockResolvedValue([]);
    await expect(
      service.getBranchComparison(
        ['ghost'],
        new Date('2026-01-01'),
        new Date('2026-02-01'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
