/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { ReceivablesService } from './receivables.service';
import { CreditTransactionRepository } from './credit-transaction.repository';
import { AccountingService } from '@accounting/accounting.service';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };

/**
 * The service drives raw repositories off the EntityManager, so the mock
 * surface is a tiny fake manager: per-entity update/save spies plus
 * query-builder stubs for the locked user + unpaid-sales reads.
 */
function makeManagerMock(opts: {
  user: {
    id: string;
    currentBalance: number;
    firstName: string;
    lastName: string;
  } | null;
  unpaidSales: Array<{ id: string; balanceDue: number }>;
}) {
  const updates: Array<{ entity: string; id: string; patch: unknown }> = [];
  const ledgerSaves: unknown[] = [];

  const userQb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(opts.user),
  };
  const salesQb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(opts.unpaidSales),
  };

  const manager = {
    getRepository: jest.fn((entity: { name?: string }) => {
      const name = entity?.name ?? '';
      if (name === 'User') {
        return {
          createQueryBuilder: jest.fn(() => userQb),
          update: jest.fn((id: string, patch: unknown) => {
            updates.push({ entity: 'User', id, patch });
            return Promise.resolve();
          }),
        };
      }
      if (name === 'Sale') {
        return {
          createQueryBuilder: jest.fn(() => salesQb),
          update: jest.fn((id: string, patch: unknown) => {
            updates.push({ entity: 'Sale', id, patch });
            return Promise.resolve();
          }),
        };
      }
      // LedgerEntry
      return {
        create: jest.fn((p: unknown) => p),
        save: jest.fn((p: unknown) => {
          ledgerSaves.push(p);
          return Promise.resolve(p);
        }),
      };
    }),
  };
  return { manager, updates, ledgerSaves };
}

describe('ReceivablesService', () => {
  let service: ReceivablesService;
  let creditTransactions: jest.Mocked<CreditTransactionRepository>;
  let accounting: jest.Mocked<AccountingService>;
  let dataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
    query: jest.Mock;
  };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
      query: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReceivablesService,
        {
          provide: CreditTransactionRepository,
          useValue: { create: jest.fn(), findByUserId: jest.fn() },
        },
        {
          provide: AccountingService,
          useValue: { createLedgerEntryWithManager: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(ReceivablesService);
    creditTransactions = moduleRef.get(CreditTransactionRepository);
    accounting = moduleRef.get(AccountingService);
  });

  function primeStatement(currentBalance = 0) {
    dataSource.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        id: USER_ID,
        firstName: 'Nimal',
        lastName: 'Perera',
        phone: null,
        currentBalance,
        creditLimit: null,
      }),
      update: jest.fn(),
    });
    creditTransactions.findByUserId.mockResolvedValue([]);
  }

  it('settles unpaid credit sales FIFO and posts the ledger credit', async () => {
    const { manager, updates } = makeManagerMock({
      user: {
        id: USER_ID,
        currentBalance: 5000,
        firstName: 'Nimal',
        lastName: 'Perera',
      },
      unpaidSales: [
        { id: 'sale-old', balanceDue: 3000 },
        { id: 'sale-new', balanceDue: 4000 },
      ],
    });
    dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
      cb(manager),
    );
    primeStatement(1000);

    await service.receivePayment(
      USER_ID,
      { amount: 4000, method: 'Cash' },
      MANAGER,
    );

    // Oldest sale fully cleared, the next one partially.
    const saleUpdates = updates.filter((u) => u.entity === 'Sale');
    expect(saleUpdates).toEqual([
      {
        entity: 'Sale',
        id: 'sale-old',
        patch: { balanceDue: 0, paymentStatus: 'Paid' },
      },
      {
        entity: 'Sale',
        id: 'sale-new',
        patch: { balanceDue: 3000, paymentStatus: 'Partially_Paid' },
      },
    ]);
    // Balance: 5000 - 4000 = 1000.
    expect(creditTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: 'Credit_Paid',
        amount: 4000,
        runningBalance: 1000,
      }),
      manager,
    );
    const userUpdate = updates.find((u) => u.entity === 'User');
    expect(userUpdate?.patch).toEqual({ currentBalance: 1000 });
    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        amount: 4000,
        branchId: BRANCH_A,
        accountCode: '1000',
      }),
    );
  });

  it('allows overpayment — balance goes negative as store credit', async () => {
    const { manager, updates } = makeManagerMock({
      user: {
        id: USER_ID,
        currentBalance: 1000,
        firstName: 'Nimal',
        lastName: 'Perera',
      },
      unpaidSales: [{ id: 'sale-old', balanceDue: 1000 }],
    });
    dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
      cb(manager),
    );
    primeStatement(-500);

    await service.receivePayment(
      USER_ID,
      { amount: 1500, method: 'Card' },
      MANAGER,
    );

    const userUpdate = updates.find((u) => u.entity === 'User');
    expect(userUpdate?.patch).toEqual({ currentBalance: -500 });
  });

  it('404s when the customer does not exist', async () => {
    const { manager } = makeManagerMock({ user: null, unpaidSales: [] });
    dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
      cb(manager),
    );
    await expect(
      service.receivePayment(USER_ID, { amount: 100, method: 'Cash' }, MANAGER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('admin must name the branch; manager cannot use another branch', async () => {
    await expect(
      service.receivePayment(USER_ID, { amount: 100, method: 'Cash' }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.receivePayment(
        USER_ID,
        { amount: 100, method: 'Cash', branchId: 'other-branch' },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('setCreditLimit rounds and persists, null clears to unlimited', async () => {
    const update = jest.fn();
    dataSource.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        id: USER_ID,
        firstName: 'Nimal',
        lastName: 'Perera',
        phone: null,
        currentBalance: 0,
        creditLimit: null,
      }),
      update,
    });
    creditTransactions.findByUserId.mockResolvedValue([]);

    await service.setCreditLimit(USER_ID, 5000.005);
    expect(update).toHaveBeenCalledWith(USER_ID, { creditLimit: 5000.01 });

    await service.setCreditLimit(USER_ID, null);
    expect(update).toHaveBeenCalledWith(USER_ID, { creditLimit: null });
  });
});
