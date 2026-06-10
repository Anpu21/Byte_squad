/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { JournalVouchersService } from './journal-vouchers.service';
import { AccountingRepository } from './accounting.repository';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const ACCOUNT_CASH = '22222222-2222-2222-2222-222222222222';
const ACCOUNT_OPEX = '33333333-3333-3333-3333-333333333333';
const VOUCHER_ID = '44444444-4444-4444-4444-444444444444';
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };

const balancedDto = {
  branchId: BRANCH_A,
  memo: 'Float top-up correction',
  lines: [
    {
      accountId: ACCOUNT_OPEX,
      entryType: LedgerEntryType.DEBIT,
      amount: 2500,
    },
    {
      accountId: ACCOUNT_CASH,
      entryType: LedgerEntryType.CREDIT,
      amount: 2500,
    },
  ],
};

describe('JournalVouchersService', () => {
  let service: JournalVouchersService;
  let accounting: jest.Mocked<AccountingRepository>;
  let counterQb: { setLock: jest.Mock; where: jest.Mock; getOne: jest.Mock };
  let voucherRepo: { save: jest.Mock; create: jest.Mock };
  let dataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
  };

  beforeEach(async () => {
    counterQb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    voucherRepo = {
      create: jest.fn((p: unknown) => p),
      save: jest.fn((p: object) => Promise.resolve({ id: VOUCHER_ID, ...p })),
    };
    const counterRepo = {
      createQueryBuilder: jest.fn(() => counterQb),
      create: jest.fn((p: unknown) => p),
      save: jest.fn((p: unknown) => Promise.resolve(p)),
    };
    const manager = {
      getRepository: jest.fn((entity: { name?: string }) => {
        if (entity?.name === 'JournalCounter') return counterRepo;
        return voucherRepo;
      }),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
      getRepository: jest.fn(() => ({
        findBy: jest
          .fn()
          .mockResolvedValue([{ id: ACCOUNT_CASH }, { id: ACCOUNT_OPEX }]),
        findOne: jest.fn().mockResolvedValue({
          id: VOUCHER_ID,
          voucherNumber: 'JV-2026-000001',
        }),
      })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JournalVouchersService,
        {
          provide: AccountingRepository,
          useValue: { createLedgerEntryWithManager: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(JournalVouchersService);
    accounting = moduleRef.get(AccountingRepository);
  });

  it('posts a balanced journal — one ledger line per dto line', async () => {
    await service.create(balancedDto, ADMIN);

    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledTimes(2);
    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entryType: LedgerEntryType.DEBIT,
        amount: 2500,
        accountId: ACCOUNT_OPEX,
        journalVoucherId: VOUCHER_ID,
      }),
    );
    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entryType: LedgerEntryType.CREDIT,
        amount: 2500,
        accountId: ACCOUNT_CASH,
      }),
    );
  });

  it('rejects an out-of-balance journal', async () => {
    await expect(
      service.create(
        {
          ...balancedDto,
          lines: [
            { ...balancedDto.lines[0], amount: 2500 },
            { ...balancedDto.lines[1], amount: 2000 },
          ],
        },
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(accounting.createLedgerEntryWithManager).not.toHaveBeenCalled();
  });

  it('rejects a one-sided journal (debits only)', async () => {
    await expect(
      service.create(
        {
          ...balancedDto,
          lines: [{ ...balancedDto.lines[0] }, { ...balancedDto.lines[0] }],
        },
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s on an unknown account', async () => {
    dataSource.getRepository.mockReturnValue({
      findBy: jest.fn().mockResolvedValue([{ id: ACCOUNT_CASH }]),
      findOne: jest.fn(),
    });
    await expect(service.create(balancedDto, ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('admin must name a branch; manager pinned to own', async () => {
    await expect(
      service.create({ ...balancedDto, branchId: undefined }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create({ ...balancedDto, branchId: 'other-branch' }, MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
