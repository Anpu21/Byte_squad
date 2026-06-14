/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { ShiftsService } from './shifts.service';
import { ShiftsRepository } from './shifts.repository';
import { PosShift } from './entities/pos-shift.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const SHIFT_ID = '33333333-3333-3333-3333-333333333333';
const CASHIER = { id: 'cashier-1', role: UserRole.CASHIER, branchId: BRANCH_A };
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };
const ADMIN_NO_BRANCH = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };

function makeShift(overrides: Partial<PosShift> = {}): PosShift {
  return {
    id: SHIFT_ID,
    branchId: BRANCH_A,
    cashierId: CASHIER.id,
    status: 'Open',
    openedAt: new Date('2026-06-10T08:00:00Z'),
    closedAt: null,
    openingFloat: 5000,
    ...overrides,
  } as PosShift;
}

describe('ShiftsService', () => {
  let service: ShiftsService;
  let repo: jest.Mocked<ShiftsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: ShiftsRepository,
          useValue: {
            findOpenForCashier: jest.fn(),
            findById: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            list: jest.fn(),
            tenderTotalsForWindow: jest.fn(),
            salesTotalsForWindow: jest.fn(),
            refundsForWindow: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(ShiftsService);
    repo = moduleRef.get(ShiftsRepository);
  });

  function primeWindow() {
    repo.tenderTotalsForWindow.mockResolvedValue({
      cash: 42000,
      cheque: 5000,
      bank: 3000,
      credit: 2000,
      electronic: 8000,
    });
    repo.salesTotalsForWindow.mockResolvedValue({
      salesCount: 37,
      salesTotal: 60000,
    });
    repo.refundsForWindow.mockResolvedValue(1500);
  }

  describe('open', () => {
    it('opens a branch-bound shift with the rounded float', async () => {
      repo.findOpenForCashier.mockResolvedValue(null);
      repo.insert.mockImplementation((p) =>
        Promise.resolve(makeShift(p as Partial<PosShift>)),
      );
      await service.open({ openingFloat: 5000.005 }, CASHIER);
      expect(repo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: BRANCH_A,
          cashierId: CASHIER.id,
          status: 'Open',
          openingFloat: 5000.01,
        }),
      );
    });

    it('409s when a shift is already open', async () => {
      repo.findOpenForCashier.mockResolvedValue(makeShift());
      await expect(
        service.open({ openingFloat: 1000 }, CASHIER),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects actors without a branch', async () => {
      await expect(
        service.open({ openingFloat: 1000 }, ADMIN_NO_BRANCH),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('current', () => {
    it('returns nulls when no shift is open', async () => {
      repo.findOpenForCashier.mockResolvedValue(null);
      const result = await service.current(CASHIER);
      expect(result).toEqual({ shift: null, live: null });
    });

    it('returns the live drawer target while open', async () => {
      repo.findOpenForCashier.mockResolvedValue(makeShift());
      primeWindow();
      const result = await service.current(CASHIER);
      // 5000 float + 42000 cash − 1500 refunds
      expect(result.live?.expectedCash).toBe(45500);
      expect(result.live?.electronic).toBe(8000);
    });
  });

  describe('close', () => {
    it('snapshots totals and computes the over/short', async () => {
      repo.findOpenForCashier.mockResolvedValue(makeShift());
      primeWindow();
      repo.findById.mockResolvedValue(
        makeShift({ status: 'Closed', overShort: -300 }),
      );

      await service.close({ countedCash: 45200 }, CASHIER);

      expect(repo.update).toHaveBeenCalledWith(
        SHIFT_ID,
        expect.objectContaining({
          status: 'Closed',
          countedCash: 45200,
          expectedCash: 45500,
          overShort: -300,
          totalCash: 42000,
          totalCheque: 5000,
          totalBank: 3000,
          totalCredit: 2000,
          totalElectronic: 8000,
          salesCount: 37,
          salesTotal: 60000,
          refundsTotal: 1500,
        }),
      );
    });

    it('404s when nothing is open', async () => {
      repo.findOpenForCashier.mockResolvedValue(null);
      await expect(
        service.close({ countedCash: 100 }, CASHIER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('pins managers to their branch', async () => {
      repo.list.mockResolvedValue({ rows: [], total: 0 });
      await service.list({ branchId: BRANCH_B }, MANAGER);
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });
  });
});
