/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingRepository } from './accounting.repository';
import { Expense } from './entities/expense.entity';
import { ExpenseStatus } from '@common/enums/expense-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';

describe('AccountingService', () => {
  let service: AccountingService;
  let repo: jest.Mocked<AccountingRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<AccountingRepository>> = {
      createLedgerEntry: jest.fn(),
      deleteLedgerByReference: jest.fn(),
      listLedger: jest.fn(),
      getLedgerSummary: jest.fn(),
      createExpense: jest.fn(),
      saveExpense: jest.fn(),
      findExpenseById: jest.fn(),
      deleteExpense: jest.fn(),
      listExpenses: jest.fn(),
      findExpensesInRange: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: AccountingRepository, useValue: repoMock },
        { provide: getRepositoryToken(Transaction), useValue: {} },
        { provide: getRepositoryToken(TransactionItem), useValue: {} },
      ],
    }).compile();

    service = module.get(AccountingService);
    repo = module.get(AccountingRepository);
  });

  describe('createExpense', () => {
    it('rejects when neither manager nor admin has a branch context', async () => {
      await expect(
        service.createExpense({ branchId: undefined } as never, {
          id: 'u',
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.createExpense).not.toHaveBeenCalled();
    });

    it('forces manager branch even when DTO supplies a different one', async () => {
      repo.createExpense.mockResolvedValue({
        id: 'e1',
        branchId: 'manager-branch',
        amount: 100,
        category: 'X',
        description: 'Y',
      } as Expense);
      await service.createExpense({ branchId: 'other-branch' } as never, {
        id: 'u',
        role: UserRole.MANAGER,
        branchId: 'manager-branch',
      });
      expect(repo.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'manager-branch' }),
      );
    });

    it('writes a matching DEBIT ledger entry', async () => {
      repo.createExpense.mockResolvedValue({
        id: 'e1',
        branchId: 'b',
        amount: 50,
        category: 'X',
        description: 'Y',
      } as Expense);
      await service.createExpense({ branchId: 'b' } as never, {
        id: 'u',
        role: UserRole.ADMIN,
        branchId: 'b',
      });
      expect(repo.createLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'b',
          amount: 50,
        }),
      );
    });
  });

  describe('deleteExpense', () => {
    it('throws NotFound when the expense is gone', async () => {
      repo.findExpenseById.mockResolvedValue(null);
      await expect(
        service.deleteExpense('missing', {
          id: 'u',
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('blocks managers from deleting another branch', async () => {
      repo.findExpenseById.mockResolvedValue({
        id: 'e1',
        branchId: 'other',
        status: ExpenseStatus.PENDING,
      } as Expense);
      await expect(
        service.deleteExpense('e1', {
          id: 'u',
          role: UserRole.MANAGER,
          branchId: 'mine',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks managers from deleting non-pending expenses', async () => {
      repo.findExpenseById.mockResolvedValue({
        id: 'e1',
        branchId: 'mine',
        status: ExpenseStatus.APPROVED,
      } as Expense);
      await expect(
        service.deleteExpense('e1', {
          id: 'u',
          role: UserRole.MANAGER,
          branchId: 'mine',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('reviewExpense', () => {
    it('refuses to re-review an already-reviewed expense', async () => {
      repo.findExpenseById.mockResolvedValue({
        id: 'e1',
        status: ExpenseStatus.APPROVED,
      } as Expense);
      await expect(
        service.reviewExpense(
          'e1',
          { status: ExpenseStatus.APPROVED },
          'reviewer',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
