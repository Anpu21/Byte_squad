import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreditAccountsService } from '@/modules/credit-accounts/credit-accounts.service';
import { CreditAccountsRepository } from '@/modules/credit-accounts/credit-accounts.repository';
import { CreditAccountTransactionsRepository } from '@/modules/credit-accounts/credit-account-transactions.repository';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountTransaction } from '@/modules/credit-accounts/entities/credit-account-transaction.entity';
import type { CreditAccountAgeing } from '@/modules/credit-accounts/types';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';
import { NotificationType } from '@common/enums/notification.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { UsersService } from '@users/users.service';
import { User } from '@users/entities/user.entity';
import { AccountingService } from '@accounting/accounting.service';
import { Sale } from '@pos/entities/sale.entity';
import type { AuthUser } from '@common/types/auth-user.type';

jest.mock('bcrypt', () => ({
  compare: jest.fn((): Promise<boolean> => Promise.resolve(true)),
}));
const compareMock = bcrypt.compare as unknown as jest.Mock;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'mgr-1',
    email: 'm@x.io',
    passwordHash: 'hash',
    firstName: 'Mala',
    lastName: 'Manager',
    role: UserRole.MANAGER,
    branchId: 'branch-1',
    ...overrides,
  } as User;
}

function makeAccount(overrides: Partial<CreditAccount> = {}): CreditAccount {
  return {
    id: 'acc-1',
    accountNo: 'KH-AAAA1111',
    holderName: 'Asha Perera',
    phone: '0771234567',
    nic: null,
    address: null,
    branchId: 'branch-1',
    status: CreditAccountStatus.PENDING,
    creditLimit: null,
    creditTermDays: null,
    currentBalance: 0,
    requestedCreditLimit: null,
    userId: null,
    loyaltyCustomerId: null,
    requestedByUserId: 'cashier-1',
    reviewedByUserId: null,
    reviewedAt: null,
    requestNote: null,
    approvalNote: null,
    rejectionReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as CreditAccount;
}

const cashier: AuthUser = {
  id: 'cashier-1',
  email: 'c@x.io',
  role: UserRole.CASHIER,
  branchId: 'branch-1',
};
const manager: AuthUser = {
  id: 'mgr-1',
  email: 'm@x.io',
  role: UserRole.MANAGER,
  branchId: 'branch-1',
};
const admin: AuthUser = {
  id: 'adm-1',
  email: 'a@x.io',
  role: UserRole.ADMIN,
  branchId: null,
};

function makeService() {
  const repo = {
    create: jest.fn(
      (input: Partial<CreditAccount>): CreditAccount => input as CreditAccount,
    ),
    save: jest.fn(
      (e: CreditAccount): Promise<CreditAccount> =>
        Promise.resolve({ ...e, id: e.id ?? 'acc-new' }),
    ),
    findById: jest.fn(
      (): Promise<CreditAccount | null> => Promise.resolve(null),
    ),
    findByBranchAndPhone: jest.fn(
      (): Promise<CreditAccount | null> => Promise.resolve(null),
    ),
    accountNoExists: jest.fn((): Promise<boolean> => Promise.resolve(false)),
    list: jest.fn((): Promise<CreditAccount[]> => Promise.resolve([])),
    search: jest.fn((): Promise<CreditAccount[]> => Promise.resolve([])),
    ageingByAccounts: jest.fn(
      (): Promise<Map<string, CreditAccountAgeing>> =>
        Promise.resolve(new Map()),
    ),
    outstandingSales: jest.fn((): Promise<Sale[]> => Promise.resolve([])),
  };
  const transactions = {
    create: jest.fn((): Promise<void> => Promise.resolve()),
    findByAccountId: jest.fn(
      (): Promise<CreditAccountTransaction[]> => Promise.resolve([]),
    ),
    findBySaleId: jest.fn(
      (): Promise<CreditAccountTransaction[]> => Promise.resolve([]),
    ),
  };
  const accounting = {
    createLedgerEntryWithManager: jest.fn(
      (): Promise<void> => Promise.resolve(),
    ),
  };
  const notifications = {
    create: jest.fn((): Promise<void> => Promise.resolve()),
  };
  const gateway = { sendToUser: jest.fn() };
  const users = {
    findManagersAndAdminsForBranches: jest.fn(
      (): Promise<Array<{ id: string }>> => Promise.resolve([{ id: 'mgr-1' }]),
    ),
    findByEmail: jest.fn((): Promise<User | null> => Promise.resolve(null)),
  };
  const jwt = {
    signAsync: jest.fn(
      (): Promise<string> => Promise.resolve('override-token'),
    ),
    verifyAsync: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };
  const service = new CreditAccountsService(
    repo as unknown as CreditAccountsRepository,
    transactions as unknown as CreditAccountTransactionsRepository,
    accounting as unknown as AccountingService,
    notifications as unknown as NotificationsService,
    gateway as unknown as NotificationsGateway,
    users as unknown as UsersService,
    dataSource as unknown as DataSource,
    jwt as unknown as JwtService,
  );
  return {
    service,
    repo,
    transactions,
    accounting,
    notifications,
    gateway,
    users,
    jwt,
    dataSource,
  };
}

describe('CreditAccountsService', () => {
  describe('request', () => {
    it('creates a PENDING account scoped to the cashier branch and notifies managers', async () => {
      const { service, repo, notifications, users } = makeService();
      repo.findById.mockResolvedValue(makeAccount());

      await service.request(
        { holderName: ' Asha ', phone: ' 0771234567 ' },
        cashier,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CreditAccountStatus.PENDING,
          branchId: 'branch-1',
          requestedByUserId: 'cashier-1',
          holderName: 'Asha',
          phone: '0771234567',
        }),
      );
      expect(repo.save.mock.calls[0][0].accountNo).toMatch(/^KH-/);
      expect(users.findManagersAndAdminsForBranches).toHaveBeenCalledWith([
        'branch-1',
      ]);
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mgr-1',
          type: NotificationType.CREDIT_ACCOUNT,
        }),
      );
    });

    it('rejects a duplicate phone at the same branch', async () => {
      const { service, repo } = makeService();
      repo.findByBranchAndPhone.mockResolvedValue(makeAccount());
      await expect(
        service.request({ holderName: 'Asha', phone: '0771234567' }, cashier),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires a branchId when an admin enrolls', async () => {
      const { service } = makeService();
      await expect(
        service.request({ holderName: 'Asha', phone: '0771234567' }, admin),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('authorizeOverride', () => {
    const dto = {
      email: 'm@x.io',
      password: 'pw',
      creditAccountId: 'acc-1',
      amount: 500,
    };

    it('rejects when no user matches the email', async () => {
      const { service, repo, users } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.ACTIVE }),
      );
      users.findByEmail.mockResolvedValue(null);
      await expect(
        service.authorizeOverride(dto, cashier),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      const { service, repo, users } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.ACTIVE }),
      );
      users.findByEmail.mockResolvedValue(makeUser());
      compareMock.mockResolvedValueOnce(false);
      await expect(
        service.authorizeOverride(dto, cashier),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects credentials that belong to a cashier', async () => {
      const { service, repo, users } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.ACTIVE }),
      );
      users.findByEmail.mockResolvedValue(makeUser({ role: UserRole.CASHIER }));
      await expect(
        service.authorizeOverride(dto, cashier),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('mints a scoped token for a valid branch manager', async () => {
      const { service, repo, users, jwt } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.ACTIVE }),
      );
      users.findByEmail.mockResolvedValue(makeUser());
      const result = await service.authorizeOverride(dto, cashier);
      expect(result.token).toBe('override-token');
      expect(result.authorizedBy).toBe('Mala Manager');
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'credit_override',
          accountId: 'acc-1',
          cap: 500,
          sub: 'mgr-1',
        }),
      );
    });
  });

  describe('approve', () => {
    it('moves PENDING → ACTIVE with the manager limit + term and notifies the cashier', async () => {
      const { service, repo, notifications } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.PENDING }),
      );

      await service.approve(
        'acc-1',
        { creditLimit: 5000, creditTermDays: 30 },
        manager,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CreditAccountStatus.ACTIVE,
          creditLimit: 5000,
          creditTermDays: 30,
          reviewedByUserId: 'mgr-1',
        }),
      );
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'cashier-1',
          type: NotificationType.CREDIT_ACCOUNT,
        }),
      );
    });

    it('rejects approving an account that is not pending or suspended', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.REJECTED }),
      );
      await expect(
        service.approve(
          'acc-1',
          { creditLimit: 5000, creditTermDays: 30 },
          manager,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forbids a manager acting on another branch', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(makeAccount({ branchId: 'branch-2' }));
      await expect(
        service.approve(
          'acc-1',
          { creditLimit: 5000, creditTermDays: 30 },
          manager,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('reject', () => {
    it('moves PENDING → REJECTED with a reason', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.PENDING }),
      );
      await service.reject(
        'acc-1',
        { rejectionReason: 'No ID provided' },
        manager,
      );
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CreditAccountStatus.REJECTED,
          rejectionReason: 'No ID provided',
        }),
      );
    });
  });

  describe('suspend / close', () => {
    it('suspends an ACTIVE account', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.ACTIVE }),
      );
      await service.suspend('acc-1', manager);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CreditAccountStatus.SUSPENDED }),
      );
    });

    it('refuses to suspend a non-active account', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.PENDING }),
      );
      await expect(service.suspend('acc-1', manager)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('closes an ACTIVE account', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({ status: CreditAccountStatus.ACTIVE }),
      );
      await service.close('acc-1', manager);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CreditAccountStatus.CLOSED }),
      );
    });
  });

  describe('list', () => {
    it('scopes a manager to their own branch', async () => {
      const { service, repo } = makeService();
      await service.list({}, manager);
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1' }),
      );
    });
  });

  describe('search', () => {
    it('maps availableCredit = limit − balance', async () => {
      const { service, repo } = makeService();
      repo.search.mockResolvedValue([
        makeAccount({
          status: CreditAccountStatus.ACTIVE,
          creditLimit: 5000,
          currentBalance: 1500,
          creditTermDays: 30,
        }),
      ]);
      const result = await service.search({ q: 'asha' }, cashier);
      expect(result[0].availableCredit).toBe(3500);
    });
  });

  describe('list (ageing)', () => {
    it('merges ageing + availableCredit into each row', async () => {
      const { service, repo } = makeService();
      repo.list.mockResolvedValue([
        makeAccount({
          status: CreditAccountStatus.ACTIVE,
          creditLimit: 5000,
          currentBalance: 1500,
        }),
      ]);
      repo.ageingByAccounts.mockResolvedValue(
        new Map<string, CreditAccountAgeing>([
          [
            'acc-1',
            {
              notDue: 1000,
              d1to30: 500,
              d31to60: 0,
              d61to90: 0,
              d90plus: 0,
              overdueTotal: 500,
              outstandingTotal: 1500,
            },
          ],
        ]),
      );
      const rows = await service.list({}, manager);
      expect(rows[0].availableCredit).toBe(3500);
      expect(rows[0].ageing.overdueTotal).toBe(500);
    });
  });

  describe('getStatement', () => {
    it('assembles balance, transactions, and flags overdue sales', async () => {
      const { service, repo, transactions } = makeService();
      repo.findById.mockResolvedValue(
        makeAccount({
          status: CreditAccountStatus.ACTIVE,
          creditLimit: 5000,
          currentBalance: 1500,
        }),
      );
      transactions.findByAccountId.mockResolvedValue([
        {
          id: 't1',
          transactionType: 'Credit_Taken',
          amount: 1500,
          runningBalance: 1500,
          referenceNo: 'CR-INV-1',
          notes: null,
          saleId: 's1',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        } as CreditAccountTransaction,
      ]);
      repo.outstandingSales.mockResolvedValue([
        {
          id: 's1',
          invoiceNumber: 'INV-1',
          total: 1500,
          balanceDue: 1500,
          dueDate: '2020-01-01',
          createdAt: new Date('2019-12-01T00:00:00Z'),
        } as Sale,
      ]);
      const statement = await service.getStatement('acc-1', manager);
      expect(statement.availableCredit).toBe(3500);
      expect(statement.transactions).toHaveLength(1);
      expect(statement.outstandingSales[0].isOverdue).toBe(true);
    });
  });

  describe('receivePayment', () => {
    it('rejects a non-positive amount before opening a transaction', async () => {
      const { service, dataSource } = makeService();
      await expect(
        service.receivePayment('acc-1', { amount: 0, method: 'Cash' }, manager),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
