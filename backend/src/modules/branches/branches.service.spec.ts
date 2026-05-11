/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesRepository } from './branches.repository';
import { Branch } from './entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Expense } from '@accounting/entities/expense.entity';

describe('BranchesService', () => {
  let service: BranchesService;
  let repo: jest.Mocked<BranchesRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<BranchesRepository>> = {
      createAndSave: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: BranchesRepository, useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Transaction), useValue: {} },
        { provide: getRepositoryToken(TransactionItem), useValue: {} },
        { provide: getRepositoryToken(Inventory), useValue: {} },
        { provide: getRepositoryToken(Expense), useValue: {} },
      ],
    }).compile();

    service = module.get(BranchesService);
    repo = module.get(BranchesRepository);
  });

  describe('update', () => {
    it('throws NotFoundException when the branch does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('missing', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates and returns the refreshed branch', async () => {
      const original = { id: 'b1', name: 'Old' } as Branch;
      const updated = { id: 'b1', name: 'New' } as Branch;
      repo.findById
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(updated);
      const result = await service.update('b1', { name: 'New' });
      expect(repo.update).toHaveBeenCalledWith('b1', { name: 'New' });
      expect(result).toBe(updated);
    });
  });

  describe('toggleActive', () => {
    it('flips isActive and persists via the repo', async () => {
      const branch = { id: 'b1', isActive: true } as Branch;
      repo.findById.mockResolvedValue(branch);
      repo.save.mockImplementation((b) => Promise.resolve(b));
      const result = await service.toggleActive('b1');
      expect(result.isActive).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'b1', isActive: false }),
      );
    });
  });

  describe('remove', () => {
    it('refuses to delete a missing branch', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
